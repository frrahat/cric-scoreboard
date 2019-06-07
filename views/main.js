var is_LIVE = false;
var data_element = document.getElementById("data");
var is_live_status_element = document.getElementById("is-live-status");
var btn_match_select = document.getElementById("btn-match-select");
var match_list_modal = document.getElementById("match-list-modal");

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

function updateScore(match_id) {
    fetch('/score-update')
    .then(response => {
        response.json().then(jsonData => {
            // console.log(jsonData);
            if (jsonData.success) {
                data_element.innerHTML = getFormatted(jsonData.matchData, 2);
                setLiveStatus(true);
            } else {
                setLiveStatus(false);
            }
        });
    }).catch(function() {
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