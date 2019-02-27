const db = require('../server/db')
const c = require('./countryutil')

let STARTYEAR = 1960 // Default start year. Overwritten below
let availableYears = []

const parseEmissions = async (csvContents) => { // Parse emissions csv file
    try {
        let rows = csvContents.split('\r\n') // Split the file to lines
        let fileDate = rows[2].replace(/"/g, '').split(',')[1] // Get the file 'Last updated' date, hoping that there is one
        const result = await db.getLastDataFetchDates() // Get things such as when was the last time the API was fetched, what is the date of the last file, etc.
        if (result.length > 0) { // If there is nothing in the database (first run)
            let emissionsFileDate = new Date(result[0]['emissions_file_date']) // The 'Last updated' date of the last csv that was processed to the database
            emissionsFileDate.setHours(0,0,0,0) // We only want to compare dates
            let fileDateObject = new Date(fileDate)
            fileDateObject.setHours(0,0,0,0)
            if (fileDateObject <= emissionsFileDate) {
                console.log('PARSEDATA: Nothing to do, file is newer or same date as the last processed file.')
                return
            }
        }
        let rowHeader = rows[4] 
        if (rowHeader.match(/("Country Name","Country Code","Indicator Name","Indicator Code",)("\d{4}",)*/)) { // Some validation that this file is valid, even though It's a bit useless
            availableYears = rowHeader.replace(/"/g, '').split(',').slice(4) // Separate years available from the csv header
            availableYears = availableYears.slice(0, availableYears.length - 1) // Remove the last item, which is a linebreak
            STARTYEAR = availableYears[0] // The first line in the CSV is the first year when we have data from.
            rows = rows.slice(5) // Remove the first row, which containts legend
            for (row of rows) {
                row = row.replace(/"/g, '').split(/,(?!\s)/) // Remove junk from the line
                if (row.length === rowHeader.split(',').length) { // Only process rows that contain data that match the header of the file
                    const LocationName = row[0]
                    if (c.countries.indexOf(LocationName) !== -1) { // Check whether this is a location or an area
                        await parseEmissionRowToDb(row, 'COUNTRY')
                    }
                    else {
                        await parseEmissionRowToDb(row, 'AREA')
                    }

                }
                else {
                    console.log('PARSEDATA: invalid row length ', row, row.length)
                }
            }
            await db.updateDate('emissions_file_date', fileDate) // Update file date

        }
        else {
            throw new Error('PARSEDATA: Invalid file header')
        }
    }
    catch (error) {
        console.log('PARSEDATA: Error ', error)
    }
}

const parseEmissionRowToDb = async (row, itemType) => { // Function to parse each row
    const locationName = row[0]
    const isoCode = row[1]
    const iso_alpha2 = c.alpha2[isoCode] // Get a 2-letter iso-3166-2 code for this location, if there is one
    const indicatorName = row[2] // Unused. For emissions file this is 
    const indicatorCode = row[3]
    const emissionsByYearArr = row.splice(4) // Split the rest of the array, which contains the yearly data
    const emissionsByYearObj = Object.assign(...availableYears.map((k, i) => ({ [k]: emissionsByYearArr[i].replace() }))) // Turn the array above into an object with emissions per year
    let year = STARTYEAR
    const result = await db.getLatestEmissionEntry(isoCode) // Find out the latest row in the database
    let locationId = null
    if (result.length === 0) { // If there is no data for this location yet
        locationId = await db.insertNewLocation(isoCode, iso_alpha2 ? iso_alpha2 : null, locationName, itemType)
    }
    else {
        locationId = result[0].id // Get location id
        if (result[0].year) { // If there are no emission entries in the database, that means we haven't added any entries yet
            year = result[0].year + 1 // Get year of last added value
        }
    }
    if (emissionsByYearObj[year] === undefined) { // If our {year:emmisions} object doesn't contain the year to be added
        console.log('PARSEDATA: Emissions data for location ' + locationName + ' is up-to-date.')
        return
    }
    while (emissionsByYearObj[year] !== undefined) { // Loop until we reach a year that doesn't have emissions data
        const emission = parseFloat(emissionsByYearObj[year])
        await db.addEmission(locationId, year, !isNaN(emission) ? emission : null)
        year++
    }
}

const parsePopulationRowToDb = async (row, itemType) => { // Basically same as above
    const locationName = row[0]
    const isoCode = row[1]
    const iso_alpha2 = c.alpha2[isoCode]
    const indicatorName = row[2]
    const indicatorCode = row[3]
    const populationByYearArr = row.splice(4)
    const populationByYearobj = Object.assign(...availableYears.map((k, i) => ({ [k]: populationByYearArr[i].replace() })))
    let year = STARTYEAR
    const result = await db.getLatestPopulationEntry(isoCode)
    let locationId = null
    if (result.length === 0) {
        locationId = await db.insertNewLocation(isoCode, iso_alpha2 ? iso_alpha2 : null, locationName, itemType)
    }
    else {
        locationId = result[0].id
        if (result[0].year) { // If there are no population entries in the database
            year = result[0].year + 1
        }
    }
    if (populationByYearobj[year] === undefined) {
        console.log('PARSEDATA: Population data for location ' + locationName + ' is up-to-date.')
        return
    }
    while (populationByYearobj[year] !== undefined) {
        const population = parseFloat(populationByYearobj[year])
        await db.addPopulation(locationId, year, !isNaN(population) ? population : null)
        year++
    }

}

const parsePopulations = async (csvContents) => { // Parse populations csv data. Same as the commented function at the top.
    try {
        let rows = csvContents.split('\r\n')
        let fileDate = rows[2].replace(/"/g, '').split(',')[1]
        const result = await db.getLastDataFetchDates()
        if (result.length > 0) {
            let populationsFileDate = new Date(result[0]['populations_file_date'])
            populationsFileDate.setHours(0,0,0,0)
            let fileDateObject = new Date(fileDate)
            fileDateObject.setHours(0,0,0,0)
            if (fileDateObject <= populationsFileDate) {
                console.log('PARSEDATA: Nothing to do, file is newer or same date as the last processed file.')
                return
            }
        }

        let rowHeader = rows[4]
        if (rowHeader.match(/("Country Name","Country Code","Indicator Name","Indicator Code",)("\d{4}",)*/)) {
            availableYears = rowHeader.replace(/"/g, '').split(',').slice(4) // Get the first row which contains legend for columns. Therefore it also contains the years which the csv has.
            availableYears = availableYears.slice(0, availableYears.length - 1)
            rows = rows.slice(5)
            for (row of rows) {
                row = row.replace(/"/g, '').split(/,(?!\s)/)
                if (row.length === rowHeader.split(',').length) {
                    const LocationName = row[0]
                    if (c.countries.indexOf(LocationName) !== -1) {
                        await parsePopulationRowToDb(row, 'COUNTRY')
                    }
                    else {
                        await parsePopulationRowToDb(row, 'AREA')
                    }

                }
                else {
                    console.log('PARSEDATA: invalid row length ', row, row.length)
                }
            }
            await db.updateDate('populations_file_date', fileDate)
        }
        else {
            throw new Error('Invalid file header')
        }
    }
    catch (error) {
        console.log('PARSEDATA: Error ', error)
    }
}

module.exports = { parsePopulations, parseEmissions }
