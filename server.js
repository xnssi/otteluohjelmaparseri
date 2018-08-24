const express = require('express')
const path = require('path')

const app = express()
const port = process.env.PORT || 5000

const puppeteer = require('puppeteer')

/**
 * Returns the HTML content of the selectable region tabs
 * (Valtakunnalliset, Eteläinen alue, ..)
 */
app.get('/api/regions', async (req, res) => {    
    const browser = await puppeteer.launch({
        headless: true,
        dumpio: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process'
        ],
    })
    const page = await browser.newPage()
    await page.goto('https://basket.fi/basket/sarjat/')
    const html = await page.evaluate(() => {
        return document.querySelector(".mbt-tabs").innerHTML
    })
    await browser.close()

    await res.send({ html })
})

/**
 * Returns the HTML content of the leagues table at basket.fi/sarjat/sarjat/
 */
app.get('/api/leagues', async (req, res) => {
    let selectedRegionId = req.query.selectedRegionId

    const browser = await puppeteer.launch({
        headless: true,
        dumpio: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process'
        ],
    })
    const page = await browser.newPage()
    await page.goto('https://basket.fi/basket/sarjat/')
    await page.click(`[id="${selectedRegionId}"]`)
    await page.waitFor(500)
    const html = await page.evaluate(() => {
        return document.querySelector(".mbt-content3").innerHTML
    })
    await browser.close()

    await res.send({ html })
})

/**
 * Returns the teams for the selected league
 */
app.get('/api/teams', async (req, res) => {
    let selectedLeagueId = req.query.selectedLeagueId

    const browser = await puppeteer.launch({
        headless: true,
        dumpio: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process'
        ],
    })
    const page = await browser.newPage()
    await page.goto(`https://www.basket.fi/basket/sarjat/ohjelma-ja-tulokset/?league_id=${selectedLeagueId}`)
    const teams = await page.evaluate(() => {
        return document.querySelector('[id="2-303-filter-team"]').innerHTML
    })
    await browser.close()

    await res.send({ teams })
})

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')))

    app.get('*', function(req, res) {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'))
    })
}

app.listen(port, () => console.log(`Listening on port ${port}`))