var is_LIVE = false;
var data_element = document.getElementById('data');
var is_live_status_element = document.getElementById("is-live-status");

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
        
        response.json().then(jsonData => {
            // console.log(jsonData);
            if (jsonData.success) {
                data_element.innerHTML = getFormatted(getSanitizedJson(jsonData), 2);
                setLiveStatus(true);
            } else {
                setLiveStatus(false);
            }
        });
    }).catch(function(err) {
        console.log('Server stopped');
        setLiveStatus(false);
    });
}

function start(match_id, interval) {
    setInterval(updateScore, interval, match_id);
}

function setLiveStatus(new_is_live) {
    let prev_is_live = is_LIVE;
    if(new_is_live != prev_is_live) {
        if(new_is_live) {
            is_live_status_element.classList.remove("led-red");
            is_live_status_element.classList.add("led-green");
        } else {
            is_live_status_element.classList.remove("led-green");
            is_live_status_element.classList.add("led-red");
        }
    }
    is_LIVE = new_is_live;
}

start(20241, 5000);