//HTML request script taken from https://stackoverflow.com/questions/45697176/send-simple-http-request-with-html-submit-button
//      Credit goes to thepi
// Authentication modification by Joonas.
//TODO: can the POST action be done inside html using <form action="/ubuntuInstance/Unknown" method="post">
function sendRequest(name, matriculationNr) {
    var xhr = new XMLHttpRequest();
    if (matriculationNr)
        xhr.open("POST", `http://localhost:8080/ubuntuInstance/${matriculationNr}`, true);
    else
        xhr.open("POST", `http://localhost:8080/ubuntuInstance/anonymous`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.send(name ? JSON.stringify({name:name}) : null);
    xhr.onload = function () {
        var data = JSON.parse(this.responseText);
        //localStorage.setItem('portID',data["yourAddress"].split(':').pop());
        window.open(data["yourAddress"]);
    }
}