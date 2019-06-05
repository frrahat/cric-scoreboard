const express = require("express");
const path = require("path");
const request = require("request");

const app = express();
const port = 8000;

const live_matches_url = "http://mapps.cricbuzz.com/cbzios/match/livematches"
const scorecard_url = "http://mapps.cricbuzz.com/cbzios/match/{match_id}/scorecard.json"

app.use('/views', express.static(__dirname + '/views'));

app.get("/", (req, res) => {
  console.log("GET /");
  res.sendFile(path.join(__dirname,'views/index.html'));
});

app.get("/score-data/:match_id", (req, res) => {
  console.log("GET /score-data/" + req.params.match_id);
  _getResponse(`http://mapps.cricbuzz.com/cbzios/match/${req.params.match_id}/scorecard.json`)
  .then(data => {
    res.send(data);
  }).catch(_res => {
    res.send(_res);
  });
});

app.listen(port, () =>
  console.log(`listening on port ${port}!`),
);

function _getResponse(url) {
  return new Promise(function(resolve, reject){
    request.get(url, function(err,res) {
      if(err) {
        err.success = false;
        return reject(err);
      }
      if(res.statusCode == 200 ) {
        data = JSON.parse(res.body);
        data.success = true;
        return resolve(data);
      }else{
        return reject({
          success: false,
          message: "unknown"
        });
      }
    });
  });
}