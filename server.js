require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

let uri = 'mongodb+srv://arganarazalvaro:' + process.env.PW + '@cluster0.yd2hm.mongodb.net/db1?retryWrites=true&w=majority';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('MongoDB is connected');
}).catch((err) => {
    console.log(`There was an error: ${err}`)
});

/* Create URL Model */
let urlSchema = new mongoose.Schema({
  original : {type: String, required: true},
  short: {type: Number}
})

let urlModel = mongoose.model('URL', urlSchema);

let responseObject = {}

app.post('/api/shorturl/new', bodyParser.urlencoded({ extended: false }) ,(request, response)=> {
  let inputUrl = request.body.url
  
let urlRegex = new RegExp(/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/);

if(!inputUrl.match(urlRegex)){
  response.json({error: 'Invalid URL'})
	return
}
  
  responseObject['original_url'] = inputUrl
  
  let inputShort = 1; // The short url value of the input url
  /* Find the highest short and make input short one higher */
  urlModel
    .findOne({})
    .sort({ short: "desc" })
    .exec((error, result) => {
      if (!error && result != undefined) {
        inputShort = result.short + 1;
      }
      if (!error) {
        urlModel.findOneAndUpdate(
          { original: inputUrl },
          { original: inputUrl, short: inputShort },
          { new: true, upsert: true },
          (error, savedUrl) => {
            if (!error) {
              responseObject["short_url"] = savedUrl.short;
              response.json(responseObject);
            }
          }
        );
      }
    });
});

app.get('/api/shorturl/:inputShort', (request, response) => {
  let inputShort = request.params.inputShort
  urlModel.findOne({short: inputShort}, (error, result) => {
    if(!error && result != undefined){
      response.redirect(result.original)
    }else{
      response.json({error: 'URL Does Not Exist'})
    }
  })
})

