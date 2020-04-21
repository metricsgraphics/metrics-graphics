import { h, Component } from 'preact'
import { Router } from 'preact-router'

import Header from './header'

// Code-splitting is automated for routes
import Home from '../routes/home'
import Lines from '../routes/lines'
import Scatter from '../routes/scatter'
import Histogram from '../routes/histogram'

export default class App extends Component {
  /** Gets fired when the route changes.
   * @param {Object} event "change" event from [preact-router](http://git.io/preact-router)
   * @param {string} event.url The newly routed URL
  */
  handleRoute = e => {
    this.currentUrl = e.url
  };

  render () {
    return (
      <div id="app">
        <Header />
        <div>
          <Router onChange={this.handleRoute}>
            <Home path="/" />
            <Lines path="/lines/" />
            <Scatter path="/scatter/" />
            <Histogram path="/histogram/" />
          </Router>
        </div>
      </div>
    )
  }
}
