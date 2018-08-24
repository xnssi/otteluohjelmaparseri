import React, { Component } from 'react'
import axios from 'axios'
import './App.css'
import loading from './loading.svg'

import Select from 'react-select'

import Navbar from './components/Navbar'
import Spacer from "./components/Spacer"

const BASKETFI_BASEURL = "https://basket.fi"

class App extends Component {
  state = {
    boxes: [],
    selectedLeague: null,
    loading: false
  }

  handleChange = (selectedLeague) => {
    this.setState({ selectedLeague })
  }

  componentDidMount() {
    this.setState({ loading: true })

    axios.get("/api/leagues")
      .then(res => {
        let parser = new DOMParser()
        let doc = parser.parseFromString(res.data.html, "text/html")
        let domBoxes = doc.querySelectorAll('td>.mbt-holder')
        let boxes = {}

        domBoxes.forEach(box => {
          let title = box.querySelector(".mbt-holder-headline .mbt-text").textContent
          let boxChildren = box.querySelectorAll(".mbt-holder-content1 table tbody tr td a")
          let leagues = {}

          boxChildren.forEach(league => {
            leagues[`${league.textContent}`] = league.attributes.href.value
          })

          boxes[title] = leagues
        })

        // console.log(boxes)
        this.setState({
          boxes,
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
    const { selectedLeague, boxes } = this.state
    let trimmedBoxes = []

    for (let propt in boxes) {
      Object.keys(boxes[propt]).forEach((league) => {
        trimmedBoxes.push({
          label: league,
          value: BASKETFI_BASEURL + boxes[propt][league]
        })
      })
    }

    return (
      <div className="App">
        <Navbar />
        <div className="container">
          <Spacer />
          { this.state.loading && 
            <div>
              <p>Lataan tietoja basket.fi:stä, odotathan hetken ☺️ </p>
              <p>Jos tässä kestää ihan saamarin kauan, koita päivittää selain</p>
              <img alt="Ladataan" src={loading} />
              <Spacer /> 
            </div>
          }
          <div className="row">
            <div className="col-lg-4 col-12">
              { !this.state.loading && 
                <div>
                  <label>1. Valitse sarja</label>
                  <Select
                    value={selectedLeague}
                    onChange={this.handleChange}
                    options={trimmedBoxes}
                  /> 
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default App
