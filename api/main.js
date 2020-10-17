const express = require('express');
const app = express();
// for parsing the body in POST request
const bodyParser = require('body-parser');

const fs = require('./src/fs/selector').getFsBackendFromName();

const upload = require('./src/upload');
const download = require('./src/download');
const events = require('./src/events');

app.get('/health', (req, res) => {
  res.status(200).send({});
})

app.post('/upload/:file_id', upload.handler(fs))
app.get('/download/:file_id', download.handler(fs))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.post('/events', events.handler(fs))

app.listen('8000', function(){
	console.log('Server listening on port 8000');
});
