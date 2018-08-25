import React, { Component } from 'react'
import axios from 'axios'
import './App.css'
import loading from './loading.svg'

import Select from 'react-select'
import FileSaver from "file-saver"
import moment from "moment"

import Navbar from './components/Navbar'
import Spacer from "./components/Spacer"

class App extends Component {
  state = {
    regions: [],
    selectedRegion: null,
    untrimmedBoxes: [],
    selectedLeague: null,
    loading: false,
    loadingLeagues: false,
    teams: [],
    loadingCalendar: false,
    calendarLoaded: false,
    selectedTeam: null,
    error: null
  }

  handleRegionChange = (selectedRegion) => {
    this.setState({ selectedRegion, loadingLeagues: true, selectedLeague: null, calendarLoaded: false })

    axios.get(`/api/leagues?selectedRegionId=${selectedRegion.value}`)
      .then(res => {
        let parser = new DOMParser()
        let doc = parser.parseFromString(res.data.html, "text/html")
        let domBoxes = doc.querySelectorAll('td>.mbt-holder')
        let untrimmedBoxes = {}

        domBoxes.forEach(box => {
          let title = box.querySelector(".mbt-holder-headline .mbt-text").textContent
          let boxChildren = box.querySelectorAll(".mbt-holder-content1 table tbody tr td a")
          let leagues = {}

          boxChildren.forEach(league => {
            leagues[`${league.textContent}`] = league.attributes.league_id.value
          })

          untrimmedBoxes[title] = leagues
        })

        this.setState({
          untrimmedBoxes,
          loadingLeagues: false
        })
      })
      .catch(err => {
        console.log(err)
        this.setState({ 
          error: true, 
          loading: false 
        })
      })
  }

  handleLeagueChange = (selectedLeague) => {
    this.setState({ selectedLeague, loadingTeams: true, selectedTeam: null, calendarLoaded: false })

    axios.get(`/api/teams?selectedLeagueId=${selectedLeague.value}`)
      .then(res => {
        let parser = new DOMParser()
        let doc = parser.parseFromString(res.data.teams, "text/html")
        let options = doc.querySelectorAll('option')
        let teamsArray = []

        options.forEach(option => {
          teamsArray.push({
            label: option.label,
            value: option.value
          })
        })

        this.setState({
          teams: teamsArray,
          loadingTeams: false
        })
      })
      .catch(err => {
        console.log(err)
        this.setState({ 
          error: true, 
          loading: false 
        })
      })
  }

  handleTeamChange = (selectedTeam) => {
    this.setState({ selectedTeam, loadingCalendar: true, calendarLoaded: false })

    axios.get(`/api/schedule?leagueId=${this.state.selectedLeague.value}&teamId=${selectedTeam.value}`)
      .then(res => {
        let parser = new DOMParser()
        let doc = parser.parseFromString(res.data.html, "text/html")
        let domRows = doc.querySelectorAll('tr.row1, tr.row2')
        let rows = []
        domRows.forEach(domRow => {
          let domColumns = domRow.querySelectorAll('td>a')
          let columns = []
          domColumns.forEach(column => {
            columns.push(column.textContent.trim())
          })
          rows.push(columns)
        })

        let icsContent = `BEGIN:VCALENDAR
VERSION:2.0`

        rows.forEach(row => {
          let ajankohta = moment(row[0], "DD.MM.YYYY h:m")
          let loppumisaika = moment(row[0], "DD.MM.YYYY h:m").add(2.5, "hours")

          icsContent += `
BEGIN:VEVENT
DTSTART:${ajankohta.format("YYYYMMDDTHHmmss")}
DTEND:${loppumisaika.format("YYYYMMDDTHHmmss")}
SUMMARY:${row[1]} vs. ${row[3]}
LOCATION:${row[4]}
DESCRIPTION:Ottelu
END:VEVENT`
        })
        
        icsContent += `
END:VCALENDAR`

        let blob = new Blob([icsContent], {type: "text/plain;charset=utf-8"});
        FileSaver.saveAs(blob, `Otteluohjelma - ${this.state.selectedTeam.label} - ${this.state.selectedLeague.label}.ics`);

        this.setState({
          loadingCalendar: false,
          calendarLoaded: true
        })
      })
      .catch(err => {
        console.log(err)
        this.setState({ 
          error: true, 
          loadingCalendar: false 
        })
      })
  }

  componentDidMount() {
    this.setState({ loading: true })

    axios.get("/api/regions")
      .then(res => {
        let parser = new DOMParser()
        let doc = parser.parseFromString(res.data.html, "text/html")
        let tabContainers = doc.querySelectorAll('.mbt-center')
        let trimmedTabs = []

        tabContainers.forEach(tab => {
          let name = tab.textContent.trim()
          let parentId = tab.parentElement.id
          trimmedTabs.push({
            name,
            parentId
          })
        })

        this.setState({
          regions: trimmedTabs,
          loading: false
        })
      })
      .catch(err => {
        console.log(err)
        this.setState({ 
          error: true, 
          loading: false 
        })
      })
  }

  render() {
    const { selectedLeague, untrimmedBoxes, selectedRegion, regions, selectedTeam, teams } = this.state

    let optionsRegions = []
    let optionsBoxes = []

    regions.forEach(region => {
      optionsRegions.push({
        label: region.name,
        value: region.parentId
      })
    })

    for (let propt in untrimmedBoxes) {
      Object.keys(untrimmedBoxes[propt]).forEach((league) => {
        optionsBoxes.push({
          label: league,
          value: untrimmedBoxes[propt][league]
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
              <p>Lataan tietoja basket.fi:stä, odotathan hetken <span role="img" alt="Emoji">☺️</span> </p>
              <p>Jos tässä kestää ihan saamarin kauan, koita päivittää selainikkuna</p>
              <img alt="Ladataan" src={loading} />
              <Spacer /> 
            </div>
          }
          { !this.state.loading &&
            <p><i style={{fontSize: "12px"}}>Valikkojen lataus voi kestää 5-30sek. Olethan kärsivällinen.</i></p>
          }
          <div className="row">
            <div className="col-lg-4 col-12">
              { !this.state.loading &&
                <div className="form-group">
                  <label>1. Valitse alue</label>
                  <Select
                    value={selectedRegion}
                    onChange={this.handleRegionChange}
                    options={optionsRegions}
                  /> 
                </div>
              }
            </div>
            <div className="col-lg-4 col-12">
              { this.state.loadingLeagues && 
                <div>
                  <p style={{fontSize: "13px"}}>Ladataan alueen sarjoja</p>
                  <img alt="Ladataan" src={loading} />
                </div>
              }
              { !this.state.loadingLeagues && this.state.selectedRegion &&
                <div className="form-group">
                  <label>2. Valitse sarja</label>
                  <Select
                    value={selectedLeague}
                    onChange={this.handleLeagueChange}
                    options={optionsBoxes}
                  /> 
                </div>
              }
            </div>
            <div className="col-lg-4 col-12">
              { this.state.loadingTeams && 
                <div>
                  <p style={{fontSize: "13px"}}>Ladataan joukkueita</p>
                  <img alt="Ladataan" src={loading} />
                </div>
              }
              { !this.state.loadingTeams && this.state.selectedRegion && this.state.selectedLeague &&
                <div className="form-group">
                  <label>3. Valitse joukkue</label>
                  <Select
                    value={selectedTeam}
                    onChange={this.handleTeamChange}
                    options={teams}
                  /> 
                </div>
              }
            </div>
          </div>
          { this.state.calendarLoaded && 
            <div>
              <p>Otteluohjelma ladattu .ics-tiedostona.</p>
              <p>Näin viet .ics-tiedoston esim.</p>
              <p>
                <a href="https://support.google.com/calendar/answer/37118?hl=fi" target="_blank">Google-kalenteriin »</a>
                <br/><a href="https://support.office.com/fi-fi/article/kalenterin-tuominen-tai-tilaaminen-outlook-comissa-cff1429c-5af6-41ec-a5b4-74f2c278e98c?omkt=fi-FI&ui=fi-FI&rs=fi-FI&ad=FI" target="_blank">Outlookiin »</a>
                <br/><a href="https://support.apple.com/fi-fi/guide/calendar/import-or-export-calendars-icl1023/mac" target="_blank">Macin kalenteriin »</a>
              </p>
            </div>
          }
          { this.state.loadingCalendar && 
            <div>
              <p style={{fontSize: "13px"}}>Generoidaan kalenteria</p>
              <img alt="Ladataan" src={loading} />
            </div>
          }
          { this.state.error &&
            <div className="row">
              <div style={{color: "red", textAlign: "center"}} className="col-12">
                <Spacer />
                <h4>Tapahtui virhe. Sori siitä.</h4>
                <p><i>Koita päivittää selainikkuna, tai tule huutamaan Twitterissä Anssille (@AnssiHautaviita).</i></p>
              </div>
            </div>
          }
        </div>
      </div>
    )
  }
}

export default App
