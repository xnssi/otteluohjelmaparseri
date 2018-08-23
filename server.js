const express = require('express')
const path = require('path')

const app = express()
const port = process.env.PORT || 5000

const puppeteer = require('puppeteer')

app.get('/api/hello', (req, res) => {
    res.send({ 
        message: 'Hello From Express' 
    })
})

app.get('/api/title', async (req, res) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process'
        ],
    })
    const page = await browser.newPage()
    await page.goto('https://basket.fi')
    let title = await page.title()
    await browser.close();

    await res.send({ title })
})

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')))

    app.get('*', function(req, res) {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'))
    })
}

app.listen(port, () => console.log(`Listening on port ${port}`))