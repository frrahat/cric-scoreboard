var is_LIVE = false;
var data_element = document.getElementById("data");
var is_live_status_element = document.getElementById("is-live-status");
var btn_match_select = document.getElementById("btn-match-select");
var match_list_modal = document.getElementById("match-list-modal");
var serviceWorkerRegistration = null;
var prev_score_data = null;

btn_match_select.addEventListener("click", () => {
    btn_match_select.innerText = "Loading";
    setMatchListModal()
    .then(() => {
        openMatchListModal();
        btn_match_select.innerText = "Selecting Match";
    }).catch(() => {
        btn_match_select.innerText = "Select Match";
        alert("Failed to fetch live match list");
    });
});

match_list_modal.addEventListener("click", (e) => {
    if(e.target.tagName === "LI") {
        setMatchId(e.target.id)
        .then(() => {
            btn_match_select.innerText = e.target.innerText;
        }).catch(() => {
            btn_match_select.innerText = "Select Match";
            alert("Failed to select match");
        });
        hideMatchListModal();
    }
});

function setMatchListModal() {
    return new Promise((resolve, reject) => {
        fetch('/match-list')
        .then(response => {
            response.json().then(jsonData => {
                // console.log(jsonData);
                if (jsonData.success) {
                    let listHtml = ""
                    jsonData.matches.forEach(match => {
                        listHtml += `<li class="match-list-item" id="${match.match_id}">${match.title}</li>`;
                    });
                    match_list_modal.innerHTML = listHtml;
                    resolve();
                } else {
                    console.log("Failed to fetch matchlist");
                    reject();
                }
            });
        }).catch(function() {
            console.log('Server stopped');
            reject();
        });
    });
}

function openMatchListModal() {
    match_list_modal.setAttribute("style", "display: block");
}

function hideMatchListModal() {
    match_list_modal.setAttribute("style", "display: none");
}

function setMatchId(match_id) {
    return new Promise((resolve, reject) => {
        fetch('/subscribe/' + match_id)
        .then(() => {
            resolve();
        }).catch(function() {
            console.log('Server stopped');
            reject();
        });
    });
}

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

function updateScore() {
    fetch('/score-update')
    .then(response => {
        response.json().then(jsonData => {
            // console.log(jsonData);
            if (jsonData.success) {
                data_element.innerHTML = getFormatted(jsonData.matchData, 2);
                setLiveStatus(true);
                processForNotification(jsonData.matchData);
                prev_score_data = jsonData.matchData;
            } else {
                setLiveStatus(false);
            }
        });
    }).catch(function() {
        console.log('Server stopped');
        setLiveStatus(false);
    });
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

/* Notification Handling
===================================================================*/

function setServiceWorkerRegistration() {
    if(!('Notification' in window && 'ServiceWorkerRegistration' in window)) {
        console.log("Persistent Notification API not supported!");
        return;
    }
    
    Notification.requestPermission(result => {
        console.log("Notification Permission :", result);
        navigator.serviceWorker.register("/static/service.js")
        .then(registration => {
            if(registration) {
                serviceWorkerRegistration = registration;
            } else {
                console.log("Could not get service worker registration");
            }
        }).catch(err => {
            console.log("Service Worker Registartion Error :", err);
        });
    });
}

function _showNotification(title, options) {
    if(serviceWorkerRegistration) {
        serviceWorkerRegistration.showNotification(title, options);
    }
}

function _getScoreInShort(latest_score_data) {
    let latest_innings = latest_score_data.innings[0];
    if(!latest_innings) return "";
    return `${latest_innings.team}: ${latest_innings.score}/${latest_innings.wicket} (${latest_innings.overs})`
}

function _getScoreChange(latest_score_data) {
    let result = {runs: 0, wickets: 0}
    if(!prev_score_data) return result;

    let latest = latest_score_data.innings;
    let prev = prev_score_data.innings;
    if(prev.length == 0 || prev.length != latest.length) return result;
    
    return {
        runs: latest[0].score - prev[0].score,
        wickets: latest[0].wicket - prev[0].wicket
    }
}

function processForNotification(latest_score_data) {
    let scoreChange = _getScoreChange(latest_score_data);
    let shortScore = _getScoreInShort(latest_score_data);
    // console.log(shortScore);
    // scoreChange = {runs: 6, wickets: 2};
    if(scoreChange.wickets >= 1) {
        _showNotification("Gone!", {
            body: shortScore,
            icon: "/static/images/W.png" 
        });
    } else if(scoreChange.runs >= 6) {
        _showNotification("SIX!", {
            body: shortScore,
            icon: "/static/images/6.png" 
        });
    } else if(scoreChange.runs >= 4) {
        _showNotification("FOUR!", {
            body: shortScore,
            icon: "/static/images/4.jpg" 
        });
    }
}

/* END of Notification Handling
===================================================================*/

function main() {
    setServiceWorkerRegistration();
    setInterval(updateScore, 5000);
}

main()
