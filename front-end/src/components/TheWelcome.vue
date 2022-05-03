<script>
export default {
  name: "WelcomePageScripts",
  props: {
    post: Object,
  },
  data() {
    return {
      HOST: import.meta.env.VITE_HOST,
    };
  },
  methods: {
    //HTML request script taken from https://stackoverflow.com/questions/45697176/send-simple-http-request-with-html-submit-button
    //      Credit goes to thepi
    // Authentication modification by Joonas.
    //TODO: can the POST action be done inside html using <form action="/ubuntuInstance/Unknown" method="post">
    sendRequest: function (name, matriculationNr) {
      const authButton = document.getElementById("authButton");
      const anonButton = document.getElementById("anonButton");
      authButton.disabled = true;
      anonButton.disabled = true;
      var xhr = new XMLHttpRequest();
      xhr.withCredentials = true; //so the cookies can be used.
      if (matriculationNr)
        xhr.open(
          "POST",
          `http://${this.HOST}:8080/ubuntuInstance/${matriculationNr}`,
          true
        );
      else
        xhr.open(
          "POST",
          `http://${this.HOST}:8080/ubuntuInstance/anonymous`,
          true
        );
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(name ? JSON.stringify({ name: name }) : null);
      var trueRouter = this.$router
      xhr.onload = function() {
        authButton.disabled = false;
        anonButton.disabled = false;
        if (this.status === 508) {
          alert(`${this.responseText}`);
          return;
        }
        var data = JSON.parse(this.response);
        if (matriculationNr)
          trueRouter.replace(`/terminal?port=${data.port}&name=${name}&mat=${matriculationNr}`);
        else
          trueRouter.replace(`/terminal?port=${data.port}&name=külaline`);
      };
      //Log it!
      var xhr = new XMLHttpRequest();
      xhr.withCredentials = true; //so the cookies can be used.
      if (matriculationNr) {
        xhr.open("PUT", `http://${this.HOST}:8080/logger`, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ matriculation: matriculationNr, taskNr: 0 }));
      }
    },

    validateLoginCredentials: function () {
      var name = document.getElementById("nimi").value;
      var matric = document.getElementById("matrikkel").value;
      if (name && matric) {
        if (matric.match(new RegExp("^[A-ZÕÜÖÄ][0-9]+$"))) {
          this.sendRequest(name, matric);
        } else
          alert(
            "Matriklinumber peab koosnema ainult SUUREST esitähest ja numbritest."
          );
      } else alert(`Väljad nimi ja matriklinumber peavad olema täidetud!`);
    },
  },
};
</script>

<template>
  <div>
    <div style="padding: 2vh 2vw">
      <div style="display: flex; justify-content: center">
        <div style="position: relative">
          <img
            style="position: absolute; left: 1%; z-index: 1"
            src="https://comserv.cs.ut.ee/img/TY_est.gif"
          />
          <img
            style="position: relative"
            src="https://comserv.cs.ut.ee/img/ty_head_1100.png"
          />
        </div>
      </div>
      <h2 style="width: 50%; margin: 4vh auto; text-align: center">
        Linuxi käsurea harjutuskeskkond - Ubuntu terminal veebibrauseris
      </h2>
    </div>
    <div class="main">
      <div>
        <p>
          Veebisait on koostatud bakalaureusetöö osana. Lehe eesmärgiks on
          meelde tuletada põhilisemad Linuxi käsurea käsud ning nende
          kasutusjuhud. Lisaks ülesannetele on olemas ka automaatkontroll mis
          värvib ülesande roheliseks kui see on edukalt sooritatud.
        </p>
        <p>
          Pärast ülesannete läbi tegemist palun täitke ka
          <a href="https://forms.gle/sxXF8phFJHQcdExv7"> tagasiside küsitlus</a
          >.
        </p>
      </div>
      <h3 style="text-align: center">Registreerimisinfo</h3>
      <p>
        Matrikkel peab koosnema ainult tähtedest ja numbritest. Tühikuid ei tohi
        lõpus olla. Registreerimiseks sisestage oma täispikk nimi ja matrikkel.
        Pärast esimest korda nime ja matrikli sisestamist ning nupu "Logi sisse"
        vajutamist ei saa oma nime ümber muuta sest see jääb seotuks matrikliga.
        Muutes matriklit luuakse uus ühendus uude arvutisse. 24h pärast viimast
        sisselogimist kustutatakse masin koos failidega.
      </p>
      <div style="width: 70%; margin: auto; border: lightgrey 1px solid">
        <div style="display: flex; margin: auto">
          <span class="loginInput">
            <label for="nimi">Nimi:</label>
            <input type="text" id="nimi" />
          </span>
          <span class="loginInput">
            <label for="matrikkel">Matrikkel:</label>
            <input type="text" id="matrikkel" />
          </span>
        </div>
        <div style="display: flex; margin: auto">
          <button
            id="authButton"
            @click="validateLoginCredentials"
            style="margin-left: auto; margin-right: 1em"
          >
            Logi sisse
          </button>
          <button
            id="anonButton"
            @click="sendRequest(null, null)"
            style="margin-left: 1em; margin-right: auto"
          >
            Jätka külalisena
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
