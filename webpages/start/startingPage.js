const HOST = '172.20.137.204'
//HTML request script taken from https://stackoverflow.com/questions/45697176/send-simple-http-request-with-html-submit-button
//      Credit goes to thepi
// Authentication modification by Joonas.
//TODO: can the POST action be done inside html using <form action="/ubuntuInstance/Unknown" method="post">
function sendRequest(name, matriculationNr) {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true; //so  taht cookiees can be used.
    if (matriculationNr)
        xhr.open("POST", `http://${HOST}:8080/ubuntuInstance/${matriculationNr}`, true);
    else
        xhr.open("POST", `http://${HOST}:8080/ubuntuInstance/anonymous`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.send(name ? JSON.stringify({ name: name }) : null);
    xhr.onload = function () {
        var data = JSON.parse(this.responseText);
        //localStorage.setItem('portID',data["yourAddress"].split(':').pop());
        window.open(data["yourAddress"]);
    }
}

function validateLoginCredentials() {
    var name = document.getElementById('nimi').value
    var matric = document.getElementById('matrikkel').value
    if (name && matric) {
        if (matric.match(new RegExp('^[A-Za-zõüäöÕÜÖÄ][0-9]+$'))) {
            sendRequest(name, matric)
        }
        else
            alert("Matriklinumber peab koosnema ainult suurest esitähest ja numbritest.")
    }
    else
        alert(`Väljad nimi ja matriklinumber peavad olema täidetud!`)
}