// Ensure console.log spits out timestamps
// firefox reader source: https://hg.mozilla.org/mozilla-central/file/tip/toolkit/components/reader
require('log-timestamp')

// Express
const app        = require('express')()
const bodyParser = require('body-parser').json()
const port       = 3000

// HTTP client
const axios = require('axios').default

// Readability, dom and dom purify
const { JSDOM }       = require('jsdom')
const readability     = require('readability')

app.get('/', (req, res) => {
  return res
    .status(400)
    .send({
      'error': 'POST (not GET) JSON, like so: {"url": "https://url/to/whatever"}'
    })
    .end
})

app.post('/', bodyParser, (req, res) => {
  const urls = req.body.urls

  if (urls === undefined || urls === '') {
    return res
      .status(400)
      .send({
        'error': 'Send JSON, like so: {"url": "https://url/to/whatever"}'
      })
      .end
  }

  console.log('Fetching ' + urls + '...')

  Promise.all(urls.map((url) => {
    return axios.get(url, {
        transformResponse: (data) => {
            const dom    = new JSDOM(data)
            const parsed = new readability(dom.window.document, {}).parse()
            let readableDOM = new JSDOM(parsed.content)
            let paragraphElems = [...readableDOM.window.document.querySelectorAll("p")]
            let paragraphTexts = paragraphElems.map(elem => {return {text: elem.textContent, url}})

            console.log('Fetched and parsed ' + url + ' successfully')
            return paragraphTexts.filter(paragraph => paragraph.text.length > 10)
        }}).catch(e => e)
    })).then(results => {
        const validResponses = results.filter(result => !(result instanceof Error));
        return res
            .status(200)
            .send({
                paragraphs: validResponses.map(res => res.data).flat(1)
            })
            .end()
    })
})

app.listen(port, () => console.log(`Readability.js server listening on port ${port}!`))