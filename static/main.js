var is_LIVE = false;
var data_element = document.getElementById("data");
var is_live_status_element = document.getElementById("is-live-status");
var btn_match_select = document.getElementById("btn-match-select");
var match_list_modal = document.getElementById("match-list-modal");
var serviceWorkerRegistration = null;
var prev_score_data = null;

var noti_check_group_element = document.getElementById("noti-check");
var noti_checks = {
    nW: true, n6: true, n4:true
}

var updateScoreTimeout;

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
            clearTimeout(updateScoreTimeout);
            updateScore();
        }).catch(() => {
            btn_match_select.innerText = "Select Match";
            alert("Failed to select match");
        });
        hideMatchListModal();
    }
});

noti_check_group_element.addEventListener("click", (e) => {
    if(e.target.tagName === "SPAN") {
        let target_id = e.target.id;
        let target_element = document.getElementById(target_id);
        for(let key in noti_checks) {
            if(noti_checks.hasOwnProperty(key)) {
                if(target_id.endsWith(key.substr(key.length-1))) {
                    // console.log(target_id, "here");
                    if(noti_checks[key]) {
                        target_element.classList.remove("noti-check-item-selected");
                        noti_checks[key] = false;
                    } else {
                        target_element.classList.add("noti-check-item-selected");
                        noti_checks[key] = true;
                    }
                }
            }
        }
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

function _getFormattedScoreOfInnings(innings) {
    if(!innings) return "";
    return `<div class="score-row">\
                <span class="team-name">${innings.team}</span> : \
                <span class="runs">${innings.runs}</span>/\<span class="key">${innings.wickets}</span>\
                <span class="overs">(${innings.overs})</span>\
            </div>`
}

function getFormattedScore(scoreData) {
    var returnString = "";
    returnString += `<div class="score-header">\
                        <span class="key">Status</span> : <span class="string">${scoreData.status}</span>\
                    </div>`;
    
    returnString += _getFormattedScoreOfInnings(scoreData.innings[0]);
    returnString += _getFormattedScoreOfInnings(scoreData.innings[1]);
    return returnString;
}

function updateScore() {
    fetch('/score-update')
    .then(response => {
        response.json().then(jsonData => {
            // console.log(jsonData);
            if (jsonData.success) {
                data_element.innerHTML = getFormattedScore(jsonData.matchData, 2);
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

    updateScoreTimeout = setTimeout(updateScore, 30000);
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

function _getLatestInningsInShort(latest_score_data) {
    let latest_innings = latest_score_data.innings[0];
    if(!latest_innings) return "";
    return `${latest_innings.team}: ${latest_innings.runs}/${latest_innings.wickets} (${latest_innings.overs})`
}

function _getScoreChange(latest_score_data) {
    let result = {runs: 0, wickets: 0}
    if(!prev_score_data) return result;

    let latest = latest_score_data.innings;
    let prev = prev_score_data.innings;
    if(prev.length == 0 || prev.length != latest.length) return result;
    
    return {
        runs: latest[0].runs - prev[0].runs,
        wickets: latest[0].wicket - prev[0].wicket
    }
}

function processForNotification(latest_score_data) {
    let scoreChange = _getScoreChange(latest_score_data);
    let shortScore = _getLatestInningsInShort(latest_score_data);
    // console.log(shortScore);
    // scoreChange = {runs: 6, wickets: 2};
    if(noti_checks["nW"] && scoreChange.wickets >= 1) {
        _showNotification("Gone!", {
            body: shortScore,
            icon: "/static/images/W.png" 
        });
    } else if(noti_checks["n6"] && scoreChange.runs >= 6) {
        _showNotification("SIX!", {
            body: shortScore,
            icon: "/static/images/6.png" 
        });
    } else if(noti_checks["n4"] && scoreChange.runs >= 4 && scoreChange.runs < 6) {
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
    updateScore();
}

main()
