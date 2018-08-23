import React, { Component } from 'react'
import axios from 'axios'
import './App.css'
import loading from './loading.svg'

import Navbar from './components/Navbar'
import Spacer from "./components/Spacer"

class App extends Component {
  state = {
    title: "",
    loading: false
  }

  componentDidMount() {
    this.setState({ loading: true })

    axios.get("/api/title")
      .then(res => {
        this.setState({ 
          title: res.data.title, 
          loading: false 
        })
      })
      .catch(err => {
        console.log(err)
        this.setState({ 
          title: "Tapahtui virhe. Sori siitä", 
          loading: false 
        })
      })
  }

  render() {
    return (
      <div className="App">
        <Navbar />
        <Spacer />
        { this.state.loading && <img alt="Ladataan" src={loading} /> }
        <p>{ this.state.title }</p>
      </div>
    )
  }
}

export default App
