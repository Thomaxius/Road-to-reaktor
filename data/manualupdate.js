const Promise = require('bluebird')
const fs = Promise.promisifyAll(require("fs"))
const Path = require('path')
require('dotenv').config()
const parseData = require('./parsedata')
const DATADIR = process.env.DATADIR
const EMISSIONS_FILE_NAME = process.env.EMISSIONS_FILE_NAME
const POPULATIONS_FILE_NAME = process.env.POPULATIONS_FILE_NAME

const parseEmissions = async () => {
        const path = Path.resolve(__dirname, DATADIR, EMISSIONS_FILE_NAME)
        const csvContents = await fs.readFileAsync(path, 'utf8')
        await parseData.parseEmissions(csvContents)
}

const parsePopulations = async () => {
        const path = Path.resolve(__dirname, DATADIR, POPULATIONS_FILE_NAME)
        const csvContents = await fs.readFileAsync(path, 'utf8')
        await parseData.parsePopulations(csvContents)
}

(async () => {
    await parseEmissions()
    await parsePopulations()
})()
