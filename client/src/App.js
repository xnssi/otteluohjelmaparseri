import React, { Component } from 'react'
import Navbar from './components/Navbar'
import axios from 'axios'
import './App.css'

class App extends Component {
  state = {
    response: ""
  }

  componentDidMount() {
    axios.get("/api/hello")
      .then(res => {
        this.setState({ response: res.data.message })
      })
      .catch(err => {
        console.log(err)
        this.setState({ response: "Tapahtui virhe. Sori siitä" })
      })
  }

  render() {
    return (
      <div className="App">
        <Navbar />
        <p>{ this.state.response }</p>
      </div>
    )
  }
}

export default App
