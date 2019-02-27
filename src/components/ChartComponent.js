import React, { Component } from 'react'
import RightSideDivComponent from './RightSideDivComponent'
import LineChart from '../chart'
import ContentHeader from './ContentHeader'
import { ClipLoader } from 'react-spinners'
import { Button } from 'semantic-ui-react'
const d3 = require("d3")


function format () { // Stolen from SO. Replace 'G' (giga) with 'B' (billions)
  const fcopy = d3.format;
         const function_ret = fcopy.apply(d3, arguments);
         return function (){
                return function_ret.apply(d3, arguments).replace(/G/, "B");
         }
}

class Chart extends Component { // The chart itself. It takes data from It's parent, which is below.
  constructor(props) {
    super(props)
    this.state = { // This is the initial data that c3 needs.
      loading: true,
      inputedBeginYear: this.props.grandParentprops.config.dataStartYear, // By default, we will use dates that is the earliest and latest date from where data is available for this said query.
      inputedEndYear: this.props.grandParentprops.config.dataEndYear,
        data: {
          xFormat: '%Y',
          x: "x",
          columns: [],
          types: {
            Population: 'line',
            Emissions: 'line',
            'Per capita': 'line',
          },
          axes: {
            'Per capita': 'y2'
        }
        },
        axis: {
          x: {
            label: "Year",
            tick: {
              format: "%Y"
            }
          },
          y: {
            label: "Population",
            tick: {}
          },
          y2: {
            show: true,
            label: 'Emissions per capita (metric tons)', // Some things here could've been programmed to be less hard-coded, such as this. It probably could've should've would've been read from the api, for example.
        }
        },
        size: {
          height: 440,
          width: 680,
        }
      }
    }

  componentDidMount() {
    this.makeData(this.props.grandParentprops.data[0]) // Make the chart from data that was passed by the first component.
  }

  componentDidUpdate() {
    if (this.props.grandParentprops.updateChart) { // A little workaround. This gets called all the time when the component loads, which causes an infinite loop. So we only set state when parent component says the chart is updated.
      this.makeData(this.props.grandParentprops.data[0])
      this.props.grandParentprops.setUpdateChartBoolean() // Set 'updateChart' to false.
    }
  }

  makeSingleDataChart(chartData) { // function for making a chart with a single country
    let years = chartData.data[0].emissionsByYear.map((element) => element.year)
    let perCapita = chartData.data[0].emissionsByYear.map((element) => element.per_capita ? (element.per_capita * 1000).toFixed(3) : null)
    let population = chartData.data[0].populationByYear.map((element) => element.population)
    let columns = [['x', ...years], ['Population', ...population], ['Per capita', ...perCapita]]
    let stateCopy = JSON.parse(JSON.stringify(this.state)) 
    stateCopy.data.columns = columns
    stateCopy.axis.y2.show = true
    stateCopy.axis.y.label = 'Population' // We will only show population if user wants data for a single country.
    stateCopy.axis.y.tick = {format: (format("0.2s"))} // We will only show population if user wants data for a single country.
    stateCopy.loading = false
    this.setState(stateCopy)
  }

  makeComparisonChart(chartData) { // This is for making charts with more than one location.
    let columns = [['x']]
    let types = {}
    chartData.data.forEach((element) => { // Go through each location in the chart api
      let perCapitaArr = [] 
      element.emissionsByYear.forEach((element) => { // Go through each years emissions 
        if (element.per_capita) { 
            perCapitaArr.push((element.per_capita * 1000).toFixed(3))
          }
        else {
            perCapitaArr.push(null)
        }
        if (columns[0].indexOf(element.year) === -1) { // If the years array doesn't contain this year yet, it will be added. Some locations might have less years than others, so we need the one with the most years.
            columns[0].push(element.year)
        }})
      
      let perCapitaColumn = [element.locationName, ...perCapitaArr.slice()] // ['Israel', 34.56, 35.76, 31.23, ...]
      types[element.locationName] = 'line'
      columns.push(perCapitaColumn.slice()) // Push created column to the chart's columns array. In the end, it should look like 
    })
    let stateCopy = JSON.parse(JSON.stringify(this.state))
    stateCopy.data.columns = columns
    stateCopy.axis.y2.show = false
    stateCopy.axis.y.label = 'Emissions per capita (metric tons)'
    stateCopy.loading = false
    this.setState(stateCopy)
  }


makeData(chartData) { // Called when component loads
  if (chartData.singleLocation) { // There is a boolean in the api that we use here
    this.makeSingleDataChart(chartData)
  }
  else {
    this.makeComparisonChart(chartData)
  }

}

changeChartType = (bartype) => { // Called when user presses the 'Bar' or 'Line' buttons under the chart
  let stateCopy = JSON.parse(JSON.stringify(this.state))
  stateCopy.data.types['Per capita'] = bartype // Change type of the per capita data to the type that the user wants.
  this.props.grandParentprops.data[0].selectedLocations.forEach((location) => stateCopy.data.types[location.locationName] = bartype) // When there are multiple countries, the columns are named after them. So we will go through each selected location (which is listed in the api). There probably is a better way..
  this.setState(stateCopy)
}

setYear = (e) => { // Called when user changes year in the year range input fields under the chart
  let obj = Object.assign({}, this.state[e.target.name])  
  obj[e.target.name] = e.target.value
  this.setState(obj)
}

updateChart = () => { // This is called when user has finished inputting the years they want data from.
  if ((parseInt(this.state.inputedBeginYear) >= this.props.grandParentprops.config.dataStartYear) && ((parseInt(this.state.inputedBeginYear) <= this.props.grandParentprops.config.dataEndYear))) { // Validate that the dates are legal, as in years that exist in the database.
    if ((parseInt(this.state.inputedEndYear) <= this.props.grandParentprops.config.dataEndYear) && (parseInt(this.state.inputedEndYear) >= this.props.grandParentprops.config.dataStartYear)) { 
      const params = {
      years: `${this.state.inputedBeginYear}-${this.state.inputedEndYear}`, 
      isocodes: [this.props.grandParentprops.data[0].selectedLocations.map((element) => element['iso_code'])].join(','),
      type: 'country',
      }
      this.props.grandParentprops.updateChartData(params) // Call the api with parent's function.
    }
    else {
      this.setState({inputedEndYear:  this.props.grandParentprops.config.dataEndYear}) // If date is invalid, we will set the input field back to the default value.
    }
  }
  else {
    this.setState({inputedBeginYear:  this.props.grandParentprops.config.dataStartYear}) // If date is invalid, we will set the input field back to the default value.
  }
}
render() {
    return (
      <div className="chart">
        {(!this.state.loading) ? <LineChart size={this.state.size} data={this.state.data} axis={this.state.axis} line={{ connectNull: false }} /> : <ClipLoader />} {/* Finally, we load the actual chart with the data built above. */}
        <Button color="blue" onClick={() => this.changeChartType('bar')}>Bar</Button> {/* Buttons for changing the chart's datatypes */}
        <Button color="blue" onClick={() => this.changeChartType('line')}>Line</Button>
        <br/><br/>
        {/* The input fields with what one can specify from what range they want data from.*/}
        <input class="yearRangeInput" type="number" min={this.props.grandParentprops.config.dataStartYear} name="inputedBeginYear" max={this.state.inputedEndYear} step="1" onBlur={this.updateChart} value={this.state.inputedBeginYear} onChange={(e) => {this.setYear(e)}} />-
        <input class="yearRangeInput" type="number" min={this.state.inputedBeginYear} max={this.props.grandParentprops.config.dataEndYear} step="1" value={this.state.inputedEndYear} onBlur={this.updateChart} name="inputedEndYear" onChange={(e) => {this.setYear(e)}} />
      </div>
    )
  }
}


export default class ChartComponent extends Component {

      render() {
        return (
          <div id="main-chart">
            {this.props.data.length > 0 ? <ContentHeader data={this.props.data[0]} /> : <div className='sweet-loading'><ClipLoader loading={this.state.loading}/></div>} {/* This is the header that is above the chart. It reads some things from the api, such as the title.*/}
          <div class="body">
          <br>
          </br>
          <br></br>
          {this.props.data && this.props.data.length > 0 && <Chart grandParentprops={this.props} /> /* Get the actual chart. */} 
          </div>
            <RightSideDivComponent grandParentprops={this.props}/> {/* This  is for rendering the sidebar which has all the country info cards. Also needs things from the API. */} 
          </div>
        )
      }
    }