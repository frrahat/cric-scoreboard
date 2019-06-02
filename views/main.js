function getFormatted(jsonObject,level) {
	var returnString = '';
	for (var key in jsonObject) {
		if (jsonObject.hasOwnProperty(key)) {
			returnString += '<div style="padding-left: ' + (level * 10) + 'px;">';
			returnString += '<span class="key">';
			returnString += key;
			returnString += '</span>';
			
			if (typeof jsonObject[key] == 'object') {
				returnString += ' {' + getFormatted(jsonObject[key],level + 1) + '}';
			}
			else {
				var type = 'number';
				if (isNaN(jsonObject[key])) {
					type = 'string';
				}
				
				returnString += ': ';
				returnString += '<span class="' + type + '">';
				returnString += jsonObject[key];
				returnString += '</span>';
			}
			returnString += '</div>';
		}
	}
	return returnString;
}

function getSanitizedJson(jsonObject) {
    result = Object();
    result["Status"] = jsonObject.status; 
    result["Innings"] = [
        {
            "team": jsonObject.Innings[0].bat_team_name,
            "innings": jsonObject.Innings[0].innings_id,
            "score": jsonObject.Innings[0].score,
            "wicket": jsonObject.Innings[0].wkts,
            "overs": jsonObject.Innings[0].ovr
        },
        {
            "team": jsonObject.Innings[1].bat_team_name,
            "innings": jsonObject.Innings[1].innings_id,
            "score": jsonObject.Innings[1].score,
            "wicket": jsonObject.Innings[1].wkts,
            "overs": jsonObject.Innings[1].ovr
        }
    ];
    return result;
}

function updateScore(match_id) {
    fetch('/score-data/' + match_id)
    .then(response => {
        if(response.status != 200) {
            console.log(`Error. Status code : ${response.status}`);
            return;
        }
        response.json().then(jsonData => {
            console.log("foo");
            console.log(jsonData);
            document.getElementById('data').innerHTML = getFormatted(getSanitizedJson(jsonData), 2);
        });
    }).catch(function(err) {
        console.log('Fetch Error :-S', err);
    });
}

function start(match_id, interval) {
    setInterval(updateScore, interval, match_id);
}

start(20241, 5000);