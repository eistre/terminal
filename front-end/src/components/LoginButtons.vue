<script>
export default {
    data() {
        return {
            API: import.meta.env.VITE_API_ADDRESS,
        };
    },
    methods: {
        //HTML request script taken from https://stackoverflow.com/questions/45697176/send-simple-http-request-with-html-submit-button
        //      Credit goes to thepi
        // Authentication modification by Joonas.
        //TODO: can the POST action be done inside html using <form action="/ubuntuInstance/Unknown" method="post">
        sendRequest: async function (name, matriculationNr) {
            const authButton = document.getElementById("authButton");
            const anonButton = document.getElementById("anonButton");
            authButton.disabled = true;
            anonButton.disabled = true;
            var xhr = new XMLHttpRequest();
            xhr.withCredentials = true; //so the cookies can be used.
            console.log(this.API)
            if (matriculationNr) {
                console.log("Posting to " + this.API);
                xhr.open("POST", `http://${this.API}:8080/ubuntuInstance/`, true);
            }
            else
                xhr.open("POST", `http://${this.API}:8080/ubuntuInstance/`, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(name ? JSON.stringify({ name: name, matriculation: matriculationNr }) : null);
            var trueRouter = this.$router;
            xhr.onload = function () {
                authButton.disabled = false;
                anonButton.disabled = false;
                if (this.status === 508) {
                    alert(`${this.responseText}`);
                    return;
                }
                var data = JSON.parse(this.response);
                var userId = data.userId
                console.log("Saved user Id " + userId)
                trueRouter.push(`/terminal?id=${userId}`);

            };
        },
        validateLoginCredentials: function () {
            var name = document.getElementById("nimi").value;
            var matric = document.getElementById("matrikkel").value;
            if (name && matric) {
                if (matric.match(new RegExp("^[A-ZÕÜÖÄ][0-9]+$"))) {
                    this.sendRequest(name, matric);
                }
                else
                    alert("Matriklinumber peab koosnema ainult SUUREST esitähest ja numbritest.");
            }
            else
                alert(`Väljad nimi ja matriklinumber peavad olema täidetud!`);
        },
    },
};
</script>
<style scoped>
#buttonsContainer {
    width: 70%;
    margin: auto;
    border: lightgrey 1px solid
}

#buttonsContainer>div {
    display: flex;
    margin: auto
}

#authButton {
    margin-left: auto;
    margin-right: 1em
}

#anonButton {
    margin-left: 1em;
    margin-right: auto
}
</style>
<template>
    <div id="buttonsContainer">
        <div>
            <span class="loginInput">
                <label for="nimi">Nimi:</label>
                <input type="text" id="nimi" />
            </span>
            <span class="loginInput">
                <label for="matrikkel">Matrikkel:</label>
                <input type="text" id="matrikkel" />
            </span>
        </div>
        <div>
            <button id="authButton" @click="validateLoginCredentials">
                Logi sisse
            </button>
            <button id="anonButton" @click="sendRequest(null, null)">
                Jätka külalisena
            </button>
        </div>
    </div>
</template>