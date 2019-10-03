import React, { Component } from 'react'
import axios from 'axios'
import './App.css'
import loading from './loading.svg'

import Select from 'react-select'
import FileSaver from "file-saver"
import moment from "moment"

import Navbar from './components/Navbar'
import Spacer from "./components/Spacer"
import { runInThisContext } from 'vm';

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
    error: null,
    etuliite: ""
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

  handleEtuliiteChange = (event) => {
    this.setState({ etuliite: event.target.value })
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
        let domCells = doc.querySelectorAll('a')
        let domCellsArray = Array.from(domCells)
        let domCellsArrayWithoutEmpties = []
        
        domCellsArray.forEach(d => {
          if (d.id) domCellsArrayWithoutEmpties.push(d)
        })

        console.log(domCellsArrayWithoutEmpties, domCellsArray)

        let domRows = []
        let chunk

        while (domCellsArrayWithoutEmpties.length > 0) {
          chunk = domCellsArrayWithoutEmpties.splice(0, 5)
          domRows.push(chunk)
        }

        let filteredMatchDetails = []

        domRows.forEach(d => {
          filteredMatchDetails.push({
            date: d[0].innerHTML,
            homeTeam: d[1].innerHTML,
            awayTeam: d[3].innerHTML,
            venue: d[4].innerHTML
          })
        })

        let icsContent = `BEGIN:VCALENDAR
VERSION:2.0`

        filteredMatchDetails.forEach(row => {
          let ajankohta = moment(row.date, "DD.MM.YYYY h:m")
          let loppumisaika = moment(row.date, "DD.MM.YYYY h:m").add(2.5, "hours")
          let etuliite = this.state.etuliite == "" ? "" : `${this.state.etuliite}: `

          icsContent += `
BEGIN:VEVENT
DTSTART:${ajankohta.format("YYYYMMDDTHHmmss")}
DTEND:${loppumisaika.format("YYYYMMDDTHHmmss")}
SUMMARY:${etuliite}${row.homeTeam} vs. ${row.awayTeam}
LOCATION:${row.venue}
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
    const { selectedLeague, untrimmedBoxes, selectedRegion, regions, selectedTeam, teams, etuliite } = this.state

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
              <p>Latauksessa voi kestää jopa 30-45 sekuntia, koska sovellus hyödyntää palvelimella pyörivää, hitaasti käynnistyvää virtuaaliselainta.</p>
              <img alt="Ladataan" src={loading} />
              <Spacer /> 
            </div>
          }
          { !this.state.loading &&
            <div>
              <p>Tällä työkalulla voit viedä valitsemasi sarjan tai joukkueen otteluohjelman kalenteriohjelmistoosi.</p>
              <p>Työkalu generoi <strong>.ics-muotoisen kalenteritiedoston</strong>, jonka voi importata esimerkiksi Google Calendariin, Outlookiin tai Macin kalenteriin. <strong>Huomioi, että mobiililaitteiden kalenterisovellukset eivät yleisesti tue .ics-tiedostoja – kalenteritiedoston importtaaminen tulee suorittaa tietokoneella.</strong></p>
              <p><i style={{fontSize: "12px"}}>Valikkojen lataus voi kestää 5-30sek.</i></p>
            </div>
          }
          <div className="row">
            <div className="col-lg-3 col-12">
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
            <div className="col-lg-3 col-12">
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
            <div className="col-lg-3 col-12">
              { this.state.loadingTeams && 
                <div>
                  <p style={{fontSize: "13px"}}>Ladataan joukkueita</p>
                  <img alt="Ladataan" src={loading} />
                </div>
              }
              { !this.state.loadingTeams && this.state.selectedRegion && this.state.selectedLeague &&
                <div className="form-group">
                  <label>3. Kalenterimerkinnän etuliite</label>
                  <input type="text" value={etuliite} onChange={this.handleEtuliiteChange} className="form-control" placeholder="Esim. Korisliiga, N1D, LM5D" /> 
                  <p className="small">Etuliite näkyy kalenteritapahtuman otsikon alussa, esim. syöttämällä "Korisliiga" otsikoksi tulee "Korisliiga: [kotijoukkue] vs [vierasjoukkue]". Voit jättää myös tyhjäksi.</p>
                </div>
              }
            </div>
            <div className="col-lg-3 col-12">
              { !this.state.loadingTeams && this.state.selectedRegion && this.state.selectedLeague &&
                <div className="form-group">
                  <label>4. Valitse joukkue</label>
                  <Select
                    value={selectedTeam}
                    onChange={this.handleTeamChange}
                    options={teams}
                  /> 
                </div>
              }
              { this.state.selectedTeam !== null && 
                <p style={{color: "white"}} id="valinnat">{`${this.state.selectedLeague.label}: ${this.state.selectedTeam.label}`}</p>
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
          <Spacer />
          <Spacer />
          <a href="https://twitter.com/AnssiHautaviita" target="_blank"><img style={{height: "40px", position: "relative", top: "1px"}} src="/tw.png"></img></a>
          <a href="https://github.com/antzah/otteluohjelmaparseri/" target="_blank"><svg height="24" className="octicon octicon-mark-github" viewBox="0 0 16 16" version="1.1" width="24" aria-hidden="true"><path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg></a>
        </div>
      </div>
    )
  }
}

export default App
