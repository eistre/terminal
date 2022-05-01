<script>
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebglAddon } from "xterm-addon-webgl";
import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
export default {
  data() {
    return {
      taskButton: null,
      HOST: "172.21.154.161",
    };
  },
  mounted() {
    //TerminalStuff
    //From https://xtermjs.org/

    const term = new Terminal({
      fontFamily: '"Cascadia Code", Menlo, monospace',
      cursorBlink: true,
      rows: 30,
      cols: 124,
    });
    //const fitAddon = new FitAddon();
    const webgl = new WebglAddon();

    const socket = io(`http://${this.HOST}:5000`); //.connect();
    //  term.loadAddon(fitAddon);
    term.open(document.getElementById("terminal-container"));
    term.loadAddon(webgl);
    term.onResize(function (evt) {
      socket.send({ cols: evt.cols });
    });
    //  fitAddon.fit()

    document.querySelector(".xterm").addEventListener("wheel", (e) => {
      if (term.buffer.active.baseY > 0) {
        e.preventDefault();
      }
    });

    socket.on("connect", function () {
      term.write("\r\n*** Connected to backend ***\r\n");
    });

    // Browser -> Backend //allows copy paste as well with ctrl + shift + v
    term.onData((data) => {
      socket.emit("data", data);
    });

    // Backend -> Browser
    socket.on("data", function (data) {
      //Automatic correct results check for tasks
      const specificFolderRegex =
        "(?=.*[a-z])(?=.*\\d)(?=.*[ ])(?=.*[\\<\\>\\=])(?=.*[\\.\\!\\?])";
      //First Task
      if (
        data.match(
          new RegExp(
            "^127\\.0\\.0\\.1[\\s\\S]*localhost[\\s\\S]*ip6-localhost[\\s\\S]*localnet[\\s\\S]*allnodes[\\s\\S]*allrouters"
          )
        )
      ) {
        this.markTaskAsDone(1);
      }
      if (
        data.match(
          new RegExp("/home/test/ CREATE,ISDIR " + specificFolderRegex)
        )
      ) {
        this.markTaskAsDone(2);
      }
      if (data.match(new RegExp("test/\\.ajutine/\\.h2sti_peidetud"))) {
        // \\.veel1Failon2ra_peidetud
        if (task3Progress[1]) {
          this.markTaskAsDone(3);
        } else task3Progress[0] = true;
      }
      if (data.match(new RegExp("\\.veel1Failon2ra_peidetud"))) {
        if (
          task3Progress[0] &&
          !data.match(new RegExp("\\.sedaEiPeaksKuvamaMeidetud"))
        ) {
          this.markTaskAsDone(3);
        } else task3Progress[1] = true;
      }
      if (data.match(new RegExp("\\.sedaEiPeaksKuvamaMeidetud")))
        task3Progress = [false, false];
      if (data.match(new RegExp("Admin[\\s\\S]+parool[\\s\\S]+on Test1234"))) {
        //Selle peaks panema kuhugi süsteemifailide sügavusse. Siis vähem obvious. Nt etc kausta või kuhugi mujale lampi kohta. Kust ikkagi pääseb ilma sudota lugema või greppima vms. Tegelt päris hea mõte. Panna see kausta, mida ei saa lugeda.
        this.markTaskAsDone(4); //Boonus ülesanne -> kirjuta rida lõppu mis paljastab et ohoo tegelikult kaustas mis on ainult
      }
      if (data.match(new RegExp("/usr/bin/nano"))) {
        this.markTaskAsDone(5);
      }
      if (data.match(new RegExp("MODIFY andmeturve"))) {
        task6Progress = true;
      }
      if (data.match(new RegExp("-rw-rw----.*test.*root.*andmeturve"))) {
        if (task6Progress) {
          this.markTaskAsDone(6);
        }
      }
      if (data.match(new RegExp("^160526"))) {
        this.markTaskAsDone(7);
      }
      if (
        data.match(
          new RegExp("/home/ CREATE,ISDIR[\\s\\S]+/home/ ATTRIB,ISDIR")
        )
      ) {
        this.markTaskAsDone(8);
      }
      if (data.match(new RegExp("DELETE,ISDIR .ajutine"))) {
        this.markTaskAsDone(9);
      }
      if (data.match(new RegExp("\\d+.*\\d+:\\d+.*inotifywait"))) {
        this.markTaskAsDone(10);
      }

      //For live debugging
      if (data.length > 3)
        //Not user typing
        console.log(data);
      if (data.startsWith("FromServer "))
        //inotify messages
        console.log(data);
      else term.write(data);
    }.bind(this));

    socket.on("disconnect", function () {
      term.write("\r\n*** Disconnected from backend ***\r\n");
    });

    console.log(window.location.port);
    fetch(`http://${this.HOST}:8080/49152`)
      .then((response) => response.json())
      .then((data) => {
        if (data["userID"] == "anonymous") {
          document
            .getElementById("name")
            .getElementsByTagName("strong")[0].innerHTML = "külaline";
          document.getElementById("matriculation").style.display = "none";
        } else {
          document
            .getElementById("matriculation")
            .getElementsByTagName("strong")[0].innerHTML = data["userID"];
          document
            .getElementById("name")
            .getElementsByTagName("strong")[0].innerHTML = data["userName"];
        }
      });
    this.markTasksAlreadyDone();
    var task3Progress = [false, false];
    var task6Progress = false;
    var coll = document.getElementsByClassName("collapsible");
    var i;

    for (i = 0; i < coll.length; i++) {
      coll[i].addEventListener("click", function () {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.maxHeight) {
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = content.scrollHeight + "px";
        }
      });
    }
  },
  methods: {
    logTask: function (matriculation, taskNr) {
      var xhr = new XMLHttpRequest();
      xhr.withCredentials = true; //so the cookies can be used.
      if (matriculation) {
        xhr.open("PUT", `http://${HOST}:8080/logger`, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(
          JSON.stringify({ matriculation: matriculation, taskNr: taskNr })
        );
      }
    },

    markTaskAsDone: function (taskNr) {
      this.taskButton =
        document.getElementsByClassName("collapsible")[taskNr - 1];
      this.taskButton.style.background = "green";
      var content = this.taskButton.nextElementSibling;
      if (content.style.maxHeight) {
        this.taskButton.classList.toggle("active");
        content.style.maxHeight = null;
      }
      const port = window.location.port;
      var doneTasks =
        window.localStorage.getItem(port) === null
          ? []
          : JSON.parse(window.localStorage.getItem(port));
      if (doneTasks.includes(taskNr)) {
        return;
      } else {
        doneTasks.push(taskNr);
        window.localStorage.setItem(port, JSON.stringify(doneTasks));
        const matriculation = document
          .getElementById("matriculation")
          .getElementsByTagName("strong")[0].innerHTML;
        if (matriculation) {
          this.logTask(matriculation, taskNr);
        }

        this.openTask(taskNr + 1);
      }
    },

    openTask: function (taskNr) {
      if (taskNr > 10) return;
      this.taskButton =
        document.getElementsByClassName("collapsible")[taskNr - 1];
      if (this.taskButton.style.background === "green") openTask(taskNr + 1);
      else {
        var content = this.taskButton.nextElementSibling;
        if (!content.style.maxHeight) {
          this.taskButton.classList.toggle("active");
          content.style.maxHeight = content.scrollHeight + "px";
        }
      }
    },

    markTasksAlreadyDone: function () {
      const port = window.location.port;
      if (window.localStorage.getItem(port) === null) {
        this.openTask(1);
      } else {
        var doneTasks = JSON.parse(window.localStorage.getItem(port));
        for (var task in doneTasks) {
          this.markTaskAsDone(parseInt(doneTasks[task]));
        }
      }
    },
  },
};
</script>
<template>
  <div id="terminal-container" style="flex: auto"></div>
</template>
<style>
@import url(https://github.com/xtermjs/xterm.js/blob/master/css/xterm.css);
/*
Also copied from https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
Credit goes to Elliot404
*/
* {
  padding: 0%;
  margin: 0%;
  box-sizing: border-box;
}

body {
  font-family: Helvetica, sans-serif, arial;
  font-size: 1em;
  color: #111;
  margin: 0 2%;
}

h1 {
  text-align: center;
}

#terminal-container {
  width: auto;
  height: auto;
  margin: 0 auto;
  padding: 2px;
}

#terminal-container .terminal {
  /* background-color: #111; pretty useless. only disturbs the eye*/
  color: #fafafa;
  padding: 2px;
}

#terminal-container .terminal:focus .terminal-cursor {
  background-color: #fafafa;
}

#content > code {
  flex: 1 1 0%;
  width: 55vw;
  max-width: 1070px;
  margin: 2em 0;
}

p > code {
  overflow-wrap: break-word;
}

/*
Copied from https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_collapsible_symbol
Credit goes to W3Schools
*/
.collapsible {
  background-color: #777;
  color: white;
  cursor: pointer;
  padding: 0.5em;
  width: 100%;
  border: none;
  text-align: left;
  outline: none;
  font-size: 15px;
}

.active,
.collapsible:hover {
  background-color: #555;
}

.collapsible:after {
  content: "\002B";
  color: white;
  font-weight: bold;
  float: right;
  margin-left: 5px;
}

.active:after {
  content: "\2212";
}

.content {
  padding: 0 18px;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.2s ease-out;
  background-color: #f1f1f1;
}

/*
Copied from
https://www.w3schools.com/css/tryit.asp?filename=trycss_tooltip
*/
.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black;
  z-index: 10;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;

  /* Position the tooltip */
  position: relative;
  z-index: 1;
}

.tooltip:hover .tooltiptext {
  position: relative;
  visibility: visible;
  z-index: 1;
  padding: 0 2px;
}
</style>