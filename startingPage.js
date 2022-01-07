//HTML request script taken from https://stackoverflow.com/questions/45697176/send-simple-http-request-with-html-submit-button
//      Credit goes to thepi
function sendServerPortNumber() {
    if (!localStorage.getItem('portID')) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", `http://localhost:8080/ubuntuInstance/Unknown`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send();
        xhr.onload = function () {
            var data = JSON.parse(this.responseText);
            localStorage.setItem('portID',data["yourAddress"].split(':').pop());
            window.open(data["yourAddress"]);
        }
    }
    else {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", `http://localhost:8080/ubuntuInstance/${localStorage.getItem('portID')}`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send();
        xhr.onload = function () {
            var data = JSON.parse(this.responseText);
            window.open(data["yourAddress"]);
        }
    }
}