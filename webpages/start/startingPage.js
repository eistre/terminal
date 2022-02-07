const HOST = '172.20.139.107'
//HTML request script taken from https://stackoverflow.com/questions/45697176/send-simple-http-request-with-html-submit-button
//      Credit goes to thepi
// Authentication modification by Joonas.
//TODO: can the POST action be done inside html using <form action="/ubuntuInstance/Unknown" method="post">
function sendRequest(name, matriculationNr) {
    const authButton = document.getElementById('authButton')
    const anonButton = document.getElementById('anonButton')
    authButton.disabled = true;
    anonButton.disabled = true;
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true; //so the cookies can be used.
    if (matriculationNr)
        xhr.open("POST", `http://${HOST}:8080/ubuntuInstance/${matriculationNr}`, true);
    else
        xhr.open("POST", `http://${HOST}:8080/ubuntuInstance/anonymous`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.send(name ? JSON.stringify({ name: name }) : null);
    xhr.onload = function () {
        authButton.disabled = false;
        anonButton.disabled = false;
        if (this.status === 508)
            alert(`${this.responseText}`)
        var data = JSON.parse(this.responseText);
        //localStorage.setItem('portID',data["yourAddress"].split(':').pop());
        window.open(data["yourAddress"]);
    }
    //Log it!
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true; //so the cookies can be used.
    if (matriculationNr) {
        xhr.open("PUT", `http://${HOST}:8080/logger`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ "matriculation": matriculationNr, "taskNr" : 0 }));
    }
}

function validateLoginCredentials() {
    var name = document.getElementById('nimi').value
    var matric = document.getElementById('matrikkel').value
    if (name && matric) {
        if (matric.match(new RegExp('^[A-ZÕÜÖÄ][0-9]+$'))) {
            sendRequest(name, matric)
        }
        else
            alert("Matriklinumber peab koosnema ainult SUUREST esitähest ja numbritest.")
    }
    else
        alert(`Väljad nimi ja matriklinumber peavad olema täidetud!`)
}