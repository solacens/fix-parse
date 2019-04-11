'use strict'

const fs = require('fs')
const moment = require('moment')
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const FIXParser = require('fixparser').default

const fixParser = new FIXParser()

// const dataString = '8=FIX.4.2|9=51|35=0|34=703|49=ABC|52=20100130-10:53:40.830|56=XYZ|10=249|' 
const dataString = fs.readFileSync(process.argv[2], 'utf8')

const allMsg = fixParser.parse(dataString)

const filteredMsg = allMsg.filter((m) => {
  const hasTransaction = m.data.some((d) => {
    return d.tag === 38
  })
  return hasTransaction
})

const structuredMsg = filteredMsg.map((msg) => {
  // console.log(msg.data)
  const data = {
    id: msg.data.find(x => x.name === 'OrderID').value,
    symbol: msg.data.find(x => x.name === 'Symbol').value,
    price: msg.data.find(x => x.name === 'LastPx').value,
    quantity: msg.data.find(x => x.name === 'OrderQty').value,
    side: (() => {
      switch(msg.data.find(x => x.name === 'Side').value){
        case '1':
        return 'Buy'
        case '2':
        return 'Sell'
        default:
        return ''
      }
    })(),
    account: msg.data.find(x => x.name === 'Account').value,
    time: moment.utc(msg.data.find(x => x.name === 'TransactTime').value, 'YYYYMMDD-HH:mm:ss').format("YYYY/MM/DD HH:mm:ss")
  }
  return data
})

const csvWriter = createCsvWriter({
  path: 'output.csv',
  header: [
    { id: 'symbol', title: 'Stock Code' },
    { id: 'quantity', title: 'Transaction Quantity' },
    { id: 'price', title: 'Transaction Price' },
    { id: 'side', title: 'Transaction Side' },
    { id: 'account', title: 'Account' },
    { id: 'id', title: 'Transaction Reference ID' },
    { id: 'time', title: 'Transaction Time' }
  ]
})

csvWriter.writeRecords(structuredMsg)
  .then(() => {
    console.log('Done')
  })