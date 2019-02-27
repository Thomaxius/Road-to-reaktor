const React = require("react")
const {findDOMNode} = require("react-dom")
require('./c3.css')
let c3

export default class LineChart extends React.Component {

  componentDidMount() {
    this.getChart()

  }
  componentDidUpdate() {
    this.getChart()
}
  componentWillUnmount() {
    this.chart.destroy()
  }

  getChart() {
    c3 = require("c3")
    const config = Object.assign({bindto: findDOMNode(this)}, this.props)
    this.chart = c3.generate(config)
  }

  render() {
    return <div></div>
  }
}

