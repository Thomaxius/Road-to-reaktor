
const getJson = (queryResult) => { // Build api
    let arr = queryResult
    let api = { title: "", subtitle: "", singleLocation: true, selectedLocations: [], selectedYearRange: {beginYear: "", endYear: ""}, data: [], }
    if (queryResult.length === 0) {
        return api
    }
    const beginYear = queryResult[0]['year']
    const endYear = queryResult[queryResult.length-1]['year']
    let title = "CO2 Emissions " + (beginYear === endYear ? "for year " + beginYear : "between " + beginYear + "-" + endYear)
    const subtitle = "Metric tons per capita"
    api = { title: title, subtitle: subtitle, singleLocation: true, selectedLocations: [], selectedYearRange: {beginYear: beginYear, endYear: endYear}, data: [], }
    let firstLocation = {}
    firstLocation['iso_code'] = queryResult[0].iso_code
    firstLocation['locationName'] = queryResult[0].name
    firstLocation['iso_3166_2'] = queryResult[0].iso_3166_2
    api.selectedLocations.push(firstLocation)
    let obj = {}
    let idToCompare = null
    arr.forEach((entry) => {

        if (!idToCompare) {
            idToCompare = entry['locationid']
            obj = Object.assign(obj, { locationid: entry['locationid'], locationName: entry['name'], isoCode: entry['iso_code'], isoCodeAlpha2: entry['iso_3166_2'], type: entry['type'], emissionsByYear: [], populationByYear: [] })
        }
        if (entry['locationid'] !== idToCompare) {
            let locationObj = {}
            locationObj['iso_code'] = entry.iso_code
            locationObj['locationName'] = entry.name
            locationObj['iso_3166_2'] = entry.iso_3166_2
            api.selectedLocations.push(Object.assign({},locationObj))
            api.data.push(Object.assign({}, obj))
            idToCompare = entry['locationid']
            api.singleLocation = false
            obj = Object.assign(obj, { locationid: entry['locationid'], locationName: entry['name'], isoCode: entry['iso_code'], isoCodeAlpha2: entry['iso_3166_2'], type: entry['type'], emissionsByYear: [], populationByYear: [] })
        }
        if (entry['locationid'] === idToCompare) {
            let emissionObj = {}
            let populationObj = {}
            emissionObj['year'] = parseFloat(entry['year'])
            emissionObj['emissions'] = parseFloat(entry['emissions'])
            emissionObj['per_capita'] = parseFloat(entry['per_capita'])
            entry['rank'] && (emissionObj['rank'] = parseFloat(entry['rank']))
            populationObj['year'] = parseFloat(entry['year'])
            populationObj['population'] = parseFloat(entry['population'])
            obj.emissionsByYear.push(emissionObj)
            obj.populationByYear.push(populationObj)
        }
        if (arr.indexOf(entry) === arr.length - 1) {
            api.data.push(Object.assign({}, obj))
        }

    })
    return api
}

const getYearRange = (yearParam) => { // Takes get parameters that look like '1960-2000'
    const range = yearParam.split('-')
    let startYear = range[0]
    let endYear = range[1]
    return [parseInt(startYear), parseInt(endYear)]
}

const buildLocationsConfig = (locationsResult) => { // Build an object that is used by the search component
    let arr = []
    locationsResult.forEach((element) => {
        let obj = { key: element.iso_code, value: element.iso_code, text: element.name, flag: (element['iso_3166_2'] ?  element['iso_3166_2'].toLowerCase() : '')}
        arr.push(obj)
    })
    return arr

}

module.exports = {getJson, getYearRange, buildLocationsConfig}