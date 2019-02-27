import React, { Component } from 'react'
import { Dropdown, Button } from 'semantic-ui-react'

export default class SearchComponent extends Component { // This component is the search bar.
  constructor(props) {
    super(props)
    this.state = {
      selectedLocations: [], // Locations that are selected by the user will be put here and then displayed as buttons.
    }
  }



  handleChange(e, value) { // Called when user chooses a country from the search-dropdown.
    const obj = this.props.locationOptions.find((element) => element.value === value) // Find the object from the config that was sent from parent
    if (this.state.selectedLocations.indexOf(obj) === -1) { // Push it to the 'selected locations' array if It's not there already.
      this.state.selectedLocations.push(obj)
      this.getNewchartData() // Get a new chart with the user-chosen countries as params.
    }
  }

  getNewchartData = () => { 
    const params = {
      isocodes: this.state.selectedLocations.map((country) => country.value) // Map through the selectedLocations array to get an ISO code for each country that the user wants to be displayed.
    }
    this.props.updateChartData(params) // Call parent's updateChartData -function.
  }

  removeFromChart(countryObj) { // This is called when a user clicks on a country-button (which is created when user chooses a country from the drop-down)
    let arr = this.state.selectedLocations 
    arr.splice(arr.indexOf(countryObj),arr.indexOf(countryObj)+1) // Remove the country from the selectedLocations array. State doesn't need to be set as we're just referencing to the array of objects anyway.
    this.getNewchartData() // Call getNewChart, which will then call parent's chart-fetching function with the correct countries.
  }

  render() {
    return (
      <div>
        <Dropdown onChange={(e, { value }) => this.handleChange(e, value)} placeholder='Select country or area..' fluid search selection options={this.props.locationOptions} />
        {this.state.selectedLocations.length > 0 && <p>Selected countries: <br />{this.state.selectedLocations.map((countryObj) => 
          <Button color="blue" disabled={this.state.selectedLocations.length === 1 && true} 
          onClick={() => this.removeFromChart(countryObj)}>{countryObj.text}</Button>)}</p>} { /* Here we go through the selected countries array and create a button for each country with onClick that calls 'removeFromChart' function. */}
      </div>
    )
  }
}