const express = require("express");
const path = require("path");
const request = require("request");

const app = express();
const port = 8000;

const live_matches_url = "http://mapps.cricbuzz.com/cbzios/match/livematches"
const scorecard_url = "http://mapps.cricbuzz.com/cbzios/match/{match_id}/scorecard.json"

var MatchId = null; 

app.use('/views', express.static(__dirname + '/views'));
app.use('/static', express.static(__dirname + '/static'));

app.get("/", (_, res) => {
  console.log("GET /");
  MatchId = null;
  res.sendFile(path.join(__dirname,'views/index.html'));
});

app.get("/match-list", (_, res) => {
  console.log("GET /match-list");
  _getResponse(live_matches_url)
  .then(data => {
    res.send(getSanitizedMatchList(data));
  }).catch(_res => {
    res.send(_res);
  });
});

app.get("/subscribe/:match_id", (req, res) => {
  console.log("GET /subscribe/" + req.params.match_id);
  MatchId = req.params.match_id;
  res.send("");
});

app.get("/score-update", (_, res) => {
  console.log("GET /score-update");
  if (!MatchId) {
    res.send({success: false});
  } else {
    _getResponse(`http://mapps.cricbuzz.com/cbzios/match/${MatchId}/scorecard.json`)
    .then(data => {
      res.send(getSanitizedScore(data));
    }).catch(_res => {
      res.send(_res);
    });
  }
});

app.get("/score-data/:match_id", (req, res) => {
  console.log("GET /score-data/" + req.params.match_id);
  _getResponse(`http://mapps.cricbuzz.com/cbzios/match/${req.params.match_id}/scorecard.json`)
  .then(data => {
    res.send(getSanitizedScore(data));
  }).catch(_res => {
    res.send(_res);
  });
});

app.listen(port, () =>
  console.log(`listening on port ${port}!`),
);

function getSanitizedMatchList(data) {
  let result = {
    matches: [],
    success: true
  };
  data.matches.forEach(match => {
    let match_id = match.match_id;
    let team1 = match.team1.name;
    let team2 = match.team2.name;
    result.matches.push({
      match_id: match_id,
      title: `${team1} vs ${team2} (${match.header.state_title})` 
    });
  });
  return result;
}

function getSanitizedScore(data) {
  let result = {
    matchData: Object(),
    success: true 
  };
  // console.log(data);
  result.matchData.status = data.status;
  result.matchData.state = data.state;
  result.matchData.innings = [];
  data.Innings.forEach(innings => {
    result.matchData.innings.push({
      team: innings.bat_team_name,
      innings_id: innings.innings_id,
      runs: innings.score,
      wickets: innings.wkts,
      overs: innings.ovr
    });
  });
  // console.log(result);
  return result;
}

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