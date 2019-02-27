const Promise = require('bluebird')
const pgp = require('pg-promise')({ promiseLib: Promise })
require('dotenv').config()

const connectionDetails = {
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	database: process.env.DB_DATABASE,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	// After 75 connections used by the bot we have 25 connections left for the website
	min: 5,
	max: 25,
  }

const db = pgp(connectionDetails)
 
	const tables = {	
			locations: 
						`CREATE TABLE locations
							(
								id serial UNIQUE
							)`,

			population: 
						`CREATE TABLE population  
							( 
								id serial UNIQUE,  
								locationid integer NOT NULL references locations (id),  
								year smallint NOT NULL,  
								population BIGINT
							)`,

			emissions: 
						`CREATE TABLE emissions  
							( 
								id serial UNIQUE,  
								locationid integer NOT NULL references locations (id),  
								year smallint NOT NULL,  
								emissions numeric  
							 )`,
								
			location_info: 
						`CREATE TABLE location_info
							( 
								id serial UNIQUE,  
								locationid integer NOT NULL references locations (id),
								iso_code text UNIQUE NOT NULL,
								iso_3166_2 text UNIQUE,
								name text NOT NULL,
								type text NOT NULL

							 )`,
            database_info: 
						`CREATE TABLE database_info
						( 
							id serial UNIQUE,  
							last_data_fetch_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
							emissions_file_date DATE,
							populations_file_date DATE
						)`,
			}

async function createTables() {
	for (table of Object.keys(tables)) { // forEach doesn't work with Async..
		await db.query(tables[table]).then((result) => console.log(`Table ${table} created` )).catch((error) => {
			if (error) {
				console.log(`Error creating table ${table}: ${error}`)
				return
			}
		})

	}
}

createTables()



