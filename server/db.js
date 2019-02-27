const Promise = require('bluebird')
const pgp = require('pg-promise')({ promiseLib: Promise })
require('dotenv').config()

const connectionDetails = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  min: 5,
  max: 25,
}

const db = pgp(connectionDetails)

const insertNewLocation = async (isoCode, isoalpha2, name, type) => {
  return await db.tx(t => {
    const q1 = t.one('INSERT INTO locations DEFAULT VALUES RETURNING id', [], (async (result) =>
      t.one(`INSERT INTO location_info (locationid, iso_code, iso_3166_2, name, type) VALUES ($1, $2, $3, $4, $5) RETURNING locationid`, [result.id, isoCode, isoalpha2, name, type])))
    return t.batch([q1])
  })
    .then(data => {
      console.log('New location added ', isoCode, isoalpha2, name, type)
      return data[0].locationid
    })
    .catch(error => {
      throw new Error(error)
    })
}

const getData = async (paramsObj) => { // Takes an object with params, so one can query for a year or year range
  let queryCondition = ''
  let params = []
  if (paramsObj.years) {
    params = paramsObj.years
    queryCondition = `AND p.year = $1 AND e.year = $1` // If we have a year present
  }
  else if (paramsObj.startYear && paramsObj.endYear) { // if we have a year range present
    params = [paramsObj.startYear, paramsObj.endYear]
    queryCondition = (`AND p.year >= $1 AND p.year <= $2 AND e.year >= $1 AND e.year <= $2`)
  }
  if (paramsObj.isoCodes.length === 0) { // Dirty workaround for when user doesn't specify a country
    const result = await db.query("SELECT iso_code FROM location_info")
    paramsObj.isoCodes = result.map((element) => element.iso_code)
  }
  let sql = `
  SELECT 
          *,
          emissions / population as per_capita
  FROM 
          emissions e 
  RIGHT JOIN 
          location_info li ON (li.locationid = e.locationid) 
  RIGHT JOIN 
          population p ON (li.locationid = p.locationid AND p.year = e.year)
  WHERE
          iso_code IN (${paramsObj.isoCodes.map((isocode) => `'${isocode}'`)})                
          ${queryCondition}
  GROUP BY 
    li.locationid, li.iso_3166_2, li.id, li.type, li.iso_code, li.name, p.id, p.locationid, p.year, e.id, e.locationid, e.year, population, emissions
  ORDER BY 
        name, p.year asc`
  return await db.query(sql, params)
}

const getLatestPopulationEntry = async (isoCode) => {
  return await db.query(`SELECT * FROM population p RIGHT JOIN location_info li ON (p.locationid = li.locationid) WHERE iso_code = $1 order by year desc limit 1`, isoCode)
}

const getLatestEmissionEntry = async (isoCode) => {
  return await db.query(`SELECT * FROM emissions e RIGHT JOIN location_info li ON (e.locationid = li.locationid) WHERE iso_code = $1 order by year desc limit 1`, isoCode)
}

const addEmission = async (locationId, year, emissions) => {
  await db.query(`INSERT INTO emissions (locationid, year, emissions) VALUES ($1, $2, $3)`, [locationId, year, emissions])
  .then((result) => {
    if (result) {
      console.log(`DB: Added emission data for year ${year}, LocationId: ${locationId}, emissions: ${emissions}`)
    }
  })
  .catch((error) => console.log(error))
}

const addPopulation = async (locationId, year, population) => {
  await db.query(`INSERT INTO population (locationid, year, population) VALUES ($1, $2, $3)`, [locationId, year, population])
  .then((result) => {
    if (result) {
      console.log(`DB: Added population data for year ${year}, Location id: ${locationId}, population: ${population}`)
    }
  })
  .catch((error) => console.log(error))
}

const getAvailableLocations = async () => await db.query(`SELECT name, iso_code, iso_3166_2 FROM location_info`)

const getLastDataFetchDates = async () => await db.query('SELECT last_data_fetch_date, emissions_file_date, populations_file_date FROM database_info')

const updateDate = async (columnNameParam, date) => {
  let columnName = ''
  if (columnNameParam === 'populations_file_date') {
    columnName = 'populations_file_date'
  }
  else {
    columnName = 'emissions_file_date'
  }
  const result = await db.query('SELECT * FROM database_info')
  if (result.length === 0) {
    await db.query(`INSERT INTO database_info (${columnName}) VALUES ($1)`, date)  .then((result) => {if (result) {console.log(`DB: Fetch date inserted, params: ${[columnName, date]}`)}})
    .catch((error) => console.log(error))
    return
  }
  await db.query(`UPDATE database_info SET last_data_fetch_date = DEFAULT, ${columnName} = $1`, date)
  .then((result) => {if (result) {console.log(`DB: Fetch date updated, params: ${[columnName, date]}`)}})
    .catch((error) => console.log(error))

}

const getAvailableDataYears = async () => {
  const result = await db.query(`
        CREATE TEMPORARY table all_three AS
        SELECT year FROM emissions WHERE year = (SELECT max(year) FROM emissions) OR year = (SELECT min(year) FROM emissions)
        UNION ALL
        SELECT year FROM population WHERE year = (SELECT max(year) FROM population) OR year = (SELECT min(year) FROM population);
        SELECT min(year), max(year) from all_three`)
  await db.query(`DROP TABLE all_three`) // A bit dirty but please give me a break, it was 5 am
  return result
}



module.exports = {
  db: "",
  insertNewLocation,
  getLatestEmissionEntry,
  addEmission,
  getLatestPopulationEntry,
  addPopulation,
  getData,
  getAvailableLocations,
  getAvailableDataYears,
  getLastDataFetchDates,
  updateDate
}

