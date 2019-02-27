import React, { Component } from 'react'
import { ClipLoader } from 'react-spinners';

export default class ContentHeader extends Component {
      render() {
        if (this.props.data.length === 0) {
          return  <div className='sweet-loading'><ClipLoader/></div>
        }
        return (
          <div className="chart-header">
            <h1>{this.props.data.title}</h1> {/* The data title and subtitle that is specified by the API */}
            <div className="subtitle">{this.props.data.subtitle}</div>
          </div>
        )
      }
    }