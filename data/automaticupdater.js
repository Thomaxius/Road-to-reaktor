
const Promise = require('bluebird')
const Fs = Promise.promisifyAll(require("fs"))
const Path = require('path')
const Axios = require('axios')
const db = require('../server/db')
const AdmZip = require('adm-zip');
const DOWNLOAD_PATH = process.env.API_DOWNLOAD_PATH
const PRESERVE_FILES = process.env.PRESERVE_API_FILES
const CHECK_INTERVAL_DAYS = parseInt(process.env.CHECK_INTERVAL_DAYS)
const SLEEP_TIME = parseInt(process.env.SLEEP_TIME_HOURS)
const POPULATIONS_OUTPUT_FILE_NAME = `populations_fetched_${new Date().getTime() / 1000}`
const EMISSIONS_OUTPUT_FILE_NAME = `emissions_fetched_${new Date().getTime() / 1000}`
const EMISSIONS_URL = process.env.WORLDBANK_API_EMISSIONS_URL
const POPULATIONS_URL = process.env.WORLDBANK_API_POPULATIONS_URL
const EMISSIONS_FILE_NAME = process.env.AUTOMATOR_EMISSIONS_FILE_NAME
const POPULATIONS_FILE_NAME = process.env.AUTOMATOR_POPULATIONS_FILE_NAME
const parseData = require('./parsedata')


async function downloadApi(url, fileName) { // Used to download the API .zip
    const path = Path.resolve(__dirname, DOWNLOAD_PATH, fileName)
    const writer = Fs.createWriteStream(path)

    const response = await Axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}



async function handleDownload(fileName, apiCsvFileName, callback) { // Used to process the API zip. When done, calls a callback, which is the ParseData functions.
    const path = Path.resolve(__dirname, DOWNLOAD_PATH, fileName)
    let zip = new AdmZip(path)
    let zipEntries = zip.getEntries()

    for (zipEntry of zipEntries) { // async doesn't work with foreach..
        if (zipEntry.entryName.substring(0, apiCsvFileName.length) === apiCsvFileName) {
            await callback(zip.readAsText(zipEntry))

        }
    }
    if (PRESERVE_FILES === 'false') { // If user wants to keep the downloaded files.
        await Fs.unlink(path, () => console.log('API CHECKER: File deleted. Possibly.'))
    }

}

async function sleep(hours) {
    return new Promise(resolve => setTimeout(resolve, hours*600000)) // Turn user-inputted amount into hours.
}

async function doTasks() {
    await downloadApi(EMISSIONS_URL, EMISSIONS_OUTPUT_FILE_NAME)
    await handleDownload(EMISSIONS_OUTPUT_FILE_NAME, EMISSIONS_FILE_NAME, parseData.parseEmissions)
    await downloadApi(POPULATIONS_URL, POPULATIONS_OUTPUT_FILE_NAME)
    await handleDownload(POPULATIONS_OUTPUT_FILE_NAME, POPULATIONS_FILE_NAME, parseData.parsePopulations)
    console.log('API CHECKER: Tasks done.')
    return
}



(async () => {
    while (true) {
        let lastChecked = null
        let nextCheckDate = null
        const result = await db.getLastDataFetchDates()
        if (result.length > 0) {
            lastChecked = nextCheckDate = new Date(result[0]['last_data_fetch_date'])
            nextCheckDate.setDate(lastChecked.getDate() + CHECK_INTERVAL_DAYS)
            if (nextCheckDate < new Date()) {
                await doTasks()
            }
            else {
                console.log(`API CHECKER: Nothing to do, next api check scheduled for ${nextCheckDate}.`)
                return
            }
        }
        else if (!lastChecked) {
            await doTasks()
        }
        console.log(`API CHECKER: Going to sleep for ${SLEEP_TIME} hours.`)
        await sleep(SLEEP_TIME)
    }


})()
