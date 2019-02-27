const express = require('express')
const Loadable = require('react-loadable')
const utils = require('../src/utils')
let bodyParser = require('body-parser')
const cors = require('cors')
const db = require('./db')
const automaticUpdater = require('../data/automaticupdater') // Start automatic updater when server starts
const config = require('dotenv').config()
const PORT = process.env.REACT_APP_NODEJS_PORT

// initialize the application and create the routes
const app = express();

if (config.length === 0) {
    console.log('Error: you are missing a configuration .env file.')
    return
}

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}))
app.use(cors())

const getConfig = async (req, res) => { // Get initial config for the app, such as what countries are available, etc.
    let dataStartYear
    let dataEndYear
    const result = await db.getAvailableDataYears() // Get range of years where we have data from
    if (result.length > 0) {
        dataStartYear = result[0]['min']
        dataEndYear = result[0]['max']
    }
    else {
        console.log('No data available.')
        return res.status(500)
    }
    const defaultChartresult = await db.getData({isoCodes:['WLD']}) // Get initial chart data, which shows world data
    if (defaultChartresult.length === 0) {
        console.log('No data available')
        return res.status(500)
    }
    const defaultChartJson = utils.getJson(defaultChartresult) // Build JSON
    const availableLocations = await db.getAvailableLocations()
    const locationOptions = utils.buildLocationsConfig(availableLocations) // Build an object with what we can configure the UI search bar options
    return res.status(200).send({chartData: defaultChartJson, config: {dataStartYear: dataStartYear, dataEndYear: dataEndYear, locationOptions: locationOptions}})
}

const getAllData = async (req, res) => { // Get emission data for every country, by year or by year range
    console.log('Requested ', req.route['path'])
    let params = {isoCodes:[]}
    if (req.params) {
        let years = req.params.years
        if (years) {
            if (years.match(/^\d\d\d\d$/)) { // If year is inputed as '1993'. Four digits, single year.
                params['years'] = years
            }
            
            else if (years.match(/\d\d\d\d-\d\d\d\d/)) { // if year is inputed as a range, 1993-2019
                let yearsArr = utils.getYearRange(years) // Split year range on dash -
                params['startYear'] = yearsArr[0]
                params['endYear'] = yearsArr[1]
            }
            else {
                return res.status(200).send("Error: invalid year range. Must either be a single year '..emissions/all/1960' or a range '..emissions/all/1960-2010'")
            }
        }
        let isoCodes = req.params.isocodes
        if (isoCodes) { 
        let isoCodes = []
            if (req.params.isocodes.match(/^([a-zA-Z]{3},)+[a-zA-Z]{3}$/)) { // if there are multiple countries separated by a comma
                isoCodes = req.params.isocodes.split(',').map((isoCode) => isoCode.toUpperCase())
            }
            else if (req.params.isocodes.match(/^\w\w\w$/)) { // if there is just a single country code and it's a 3-letter code
                isoCodes.push(req.params.isocodes.toUpperCase())
            }
            else {
                res.status(400).send("Error: Invalid isocode. Must be 3 letters, or 3 letters separated by a comma if you're querying for multiple countries.")
            }
            params['isoCodes'] = isoCodes
        }
    }
    let result = await db.getData(params)  // Get data with params we gathered above
        result = utils.getJson(result) // build JSON. Empty JSON if no data.
    return res.status(200).send(result)
}

app.get(process.env.REACT_APP_EMISSIONS_ALL, getAllData)
app.get(process.env.REACT_APP_EMISSIONS_YEARS + ":years", getAllData)
app.get(process.env.REACT_APP_EMISSIONS_ISOCODES + ":isocodes", getAllData)
app.get(process.env.REACT_APP_EMISSIONS_YEARS_ISOCODES + ":isocodes/:years", getAllData)
app.get(process.env.CONFIG_PATH, getConfig)


process.on('SIGUSR2', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))
// start the app
Loadable.preloadAll().then(() => {
    app.listen(PORT, (error) => {
        if (error) {
            return console.log('something bad happened', error);
        }

        console.log("listening on " + PORT + "...");
    });
});