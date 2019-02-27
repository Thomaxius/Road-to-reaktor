import React, { Component } from 'react'
import ReactCountryFlag from "react-country-flag"


const card = (data) => {
  return (
    <div class="card">
      <div class="content">
        <ReactCountryFlag code={data.isocode_alpha2 ? data.isocode_alpha2 : ''} svg /> {/* This is for displaying the small emoji-country flag */}
        <div class="header">
          {data.name}
        </div>
        <div class="meta">
        </div>
        <div class="description">
          {(!data.emission_begin && !data.emission_end && !data.population_begin && !data.population_end) && 'No data available for selected year(s).'}
          {data.emission_begin && <div><b>Emissions ({data.emission_begin.year})</b>: {data.emission_begin.emissions.toFixed(2)} (kt of CO2 eq)<br /></div>}
          {data.emission_end && data.emission_end !== data.emission_begin && <div><b>Emissions ({data.emission_end.year})</b>: {data.emission_end.emissions.toFixed(2)} (kt of CO2 eq)</div>}
          {data.population_begin && <div><b>Population ({data.population_begin.year})</b>: {Number(data.population_begin.population).toLocaleString()}</div>}
          {data.population_end && data.population_end !== data.population_begin && <div><b>Population ({data.population_end.year})</b>: {Number(data.population_end.population).toLocaleString()} </div>}
        </div>
      </div>
      <div class="extra content">
      </div>
    </div>
  )
}

export default class RightSideDivComponent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      data: []
    }
  }

  componentDidMount() {
    this.handlePropsData()
  }

  componentDidUpdate() {
    this.handlePropsData()
  }

  handlePropsData() { // Called when the component is updated or mounted.
    if (this.props.grandParentprops.updateChart) { // Workaround to avoid infinite setState loop. Only set state if parent tells that there is new content available.
      let data = []
      const earliestEntry = (arr, key) => arr.find((element) => element[key] && element)
      const latestEntry = (arr, key) => arr.reverse().find((element) => element[key] && element)
      this.props.grandParentprops.data[0].data.map((element) => { // Go through the API and find out emissions and population for the first and last years available.
        let obj = {}
        obj['location_type'] = element.type
        obj['name'] = element.locationName
        obj['isocode_alpha2'] = element.isoCodeAlpha2
        obj['population_begin'] = earliestEntry(element.populationByYear, 'population')
        obj['population_end'] = latestEntry(element.populationByYear, 'population')
        obj['emission_begin'] = earliestEntry(element.emissionsByYear, 'emissions')
        obj['emission_end'] = latestEntry(element.emissionsByYear, 'emissions')
        data.push(obj)
      })
      this.setState({ data: data })

    }

  }

  render() {
    return (
      <aside className="sidebar">
        <div class="ui cards">
          {this.state.data.length > 0 && this.state.data.map((country) => card(country))} {/* Get a card for each country that is rendered to the chart */}
        </div>
      </aside>
    )
  }
}