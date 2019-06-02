const express = require("express");
const path = require("path");
const request = require("request");

const app = express();
const port = 8000;

const live_matches_url = "http://mapps.cricbuzz.com/cbzios/match/livematches"
const scorecard_url = "http://mapps.cricbuzz.com/cbzios/match/{match_id}/scorecard.json"

app.use('/views', express.static(__dirname + '/views'));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname,'views/index.html'));
});

app.get("/score-data/:match_id", (req, res) => {
  _getResponse(`http://mapps.cricbuzz.com/cbzios/match/${req.params.match_id}/scorecard.json`)
  .then(data => {
    res.send(data);
  });
});

app.listen(port, () =>
  console.log(`listening on port ${port}!`),
);

function _getResponse(url) {
  return new Promise(function(resolve, reject){
    request.get(url, function(err,res,body) {
      if(err) {
        reject(err);
      }
      if(res == undefined) {
        reject("undefined res");
      }
      if(res.statusCode == 200 ) {
        data = JSON.parse(res.body);
        resolve(data);
      }else{
        reject("error");
      }
    });
  });
}