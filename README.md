# Fyre emissions app

This is my take on Reaktor's pre-assignment, which involved creating an app with what users can browse yearly emissions between countries and areas. 

I, of course, started doing this during the last week, so It is a bit unpolished. There is a bit of spaghetti code here and there, and the design of the component\data flow could've been better, but I'm mostly happy with the results.

What is done is that the app downloads a zip provided by worldbank and extracts it, and then parses it for data, and adds it to a database. Users can customize a lot of things with the .env file, such as API endpoints.

The app contains the following endpoints: 
- Fetching emissions of a single location (/emissions/all/FIN/)
- Fetching emissions of a multiple locations (/emissions/all/FIN,SWE,NOR/)
- Fetching the above with a single year (/emissions/all/FIN/2005)
- Fetching the above with a year range (/emissions/all/FIN/2005-2015)
- Fetching all countries and all data for all years (/emissions/all/)
- Fetching all countries and all data for a specific year (/emissions/all/years/2010)

**How to run:**
- run npm init
- Edit .env, add Postgres etc. configuration
- Create tables with ```npm run-script init-db```
- Start the server with  ```npm start-server init-db```. This will also download newest data csvs from API and parse them to the database
- Start the react app with ```npm start``` (Developement mode)

Custom things:
- One can parse csv's manually by running ```npm run-script manual-api-update```. It uses file names (or parts of filenames) defined in the .env file

Demo:
http://emissionsapp.santamaa.com
