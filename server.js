const express = require('express')
const path = require('path')

const app = express()
const port = process.env.PORT || 5000

const puppeteer = require('puppeteer')

/**
 * Returns the HTML content of the nationwide leagues table at basket.fi/sarjat/sarjat/
 */
app.get('/api/leagues', async (req, res) => {
    let alue = req.query.alue || null
    
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
        return document.querySelector(".mbt-content3").innerHTML
    })
    await browser.close()

    await res.send({ html })
})

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')))

    app.get('*', function(req, res) {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'))
    })
}

app.listen(port, () => console.log(`Listening on port ${port}`))