import React, { Component } from 'react'
import './App.css'
import SearchComponent from './components/SearchComponent'
import ChartComponent from './components/ChartComponent'
import axios from 'axios'
require('dotenv').config()

const SERVER_HOSTNAME = process.env.REACT_APP_NODEJS_HOST
const EMISSIONS_API_ENDPOINT = process.env.REACT_APP_EMISSIONS_ALL

const Header = () =>
  <header id="header">
    Fyre emissions app
  </header>


const getInitialData = async () => {
  return await axios.get(`${SERVER_HOSTNAME}/getconfig`, // Get initial config from the server, which contains things such as the default chart, available countries for the search bar, etc.
    {
    }).then((result) => result).catch((error) => {
      console.log("No data available from the server. ", error)
    })
}


class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: [],
      loading: true,
      updateChart: true // This is sent to child components. More info there.
    }
  }

  updateChartData = async (params) => { // This function is passed to child components, who can also use it.
    if (!params.years) { // If there is no year inputed, we will use the previous ones
      params.years = this.state.data[0].selectedYearRange.beginYear + '-' + this.state.data[0].selectedYearRange.endYear // This is a bit stupid way to handle the year range, but I don't have time to redesign the api properly
    }
    return await axios.get(`${SERVER_HOSTNAME}${EMISSIONS_API_ENDPOINT}${params.isocodes}/${params.years}`).then((result) => {
      this.setState({ data: [result.data], loading: false, updateChart: true } // Here we set the update chart boolean to true, so child components know to set their states.
      )
    }
    ).catch((error) => {
      console.log("No data available from the server. ", error) // A bit lazy error-handling
    })
  }

  setUpdateChartBoolean = () => this.setState({ updateChart: false ? true : false }) // After a child component has updated their data, they will use this function to set this boolean to false. This all is to avoid a setstate-loop.

  async componentDidMount() {
    const result = await getInitialData() // Get initial data (config) from the server.
    if (result) {
      this.setState({ data: [result.data.chartData], config: result.data.config, loading: false })
    }
  }

  render() {
    return (
      <div>
        <Header />
        <div id="main" class="content-wrapper">
          {!this.state.loading && this.state.data.length > 0 && 
            <SearchComponent updateChartData={this.updateChartData} locationOptions={this.state.config.locationOptions} selectedLocations={this.state.data[0].selectedLocations} />} {/* Search bar component, which needs things like country iso codes */}
          {!this.state.loading && this.state.data.length > 0 && <ChartComponent data={this.state.data} updateChartData={this.updateChartData} config={this.state.config} updateChart={this.state.updateChart} setUpdateChartBoolean={this.setUpdateChartBoolean} />}
          {/* Render the chart component, which needs some functions and things from the parent. Redux could be of use here.. */}
          <div />
        </div>
      </div>
    )
  }
}

export default App;
