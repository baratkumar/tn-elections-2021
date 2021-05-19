import axios from 'axios'
import cheerio from 'cheerio'
import fs from 'fs'

const BASE_URL = "https://www.timesnownews.com"

const fetchDataFromURL = async(url) => {
  const { data } = await axios.get(url)
  return cheerio.load(data).html()
}

const fetchConstituencyList = async() => {
  const constituency = []
  const initialUrl = `${BASE_URL}/elections/tamil-nadu-constituency-wise-result`
  const htmlResponse = await fetchDataFromURL(initialUrl)
  const $ = cheerio.load(htmlResponse)
  $('div[class="E_ALlCons"]')
    .find('ul > li > a')
    .each((index, element) => {
      const data = {}
      data.index = index + 1
      data.name = $(element).data()['nameen']
      data.url = $(element).attr('href')
      constituency.push(data)
    })
  return constituency
}

const fetchResultByConstituency = async({ url, name, index }) => {
  const constituency = name
  const result = []
  let resultData = {}
  const columnArray = ['name', 'party', 'votes', 'votes_share_percent']
  const subUrl = BASE_URL + url
  const htmlResponse = await fetchDataFromURL(subUrl)
  const $ = cheerio.load(htmlResponse)
  $('div[class="_be_20_candidate_table"]')
    .find('table > tbody > tr > td')
    .each((index, element) => {
      const mod4Value = index % 4
      resultData[columnArray[mod4Value]] = $(element)
        .text()
        .replace(/(?:\n|\t|WINS|LOSES)/g,'')
      if (mod4Value === 3) {
        result.push(resultData)
        resultData = {}
      }
    })
  let fileData = fs.readFileSync('result.json')
  fileData = JSON.parse(fileData)
  fileData.push({ constituency, result })
  fs.writeFileSync('result.json', JSON.stringify(fileData))
  console.log(`Done ----------> ${index}`, constituency)
  return
}

const tnElections2021Results = async() => {
  const constituencyList = await fetchConstituencyList()
  for (let eachConstituency of constituencyList) {
    await fetchResultByConstituency(eachConstituency)
  }
  return 'Done'
}

const result = await tnElections2021Results()
console.log(result)
