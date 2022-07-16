<script>
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebglAddon } from "xterm-addon-webgl";
import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
export default {
  data() {
    return {
      taskButton: null,
      HOST: import.meta.env.VITE_HOST,
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

    const port = this.$route.query.port

    socket.on("connect", function () {
      term.write("\r\n*** Connected to backend ***\r\n");
      socket.emit("connect to port", port)
      console.log("connected to port",port)
    });

    // Browser -> Backend //allows copy paste as well with ctrl + shift + v
    term.onData((data) => {
      socket.emit("data" , data);
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
  <div id="terminal-container">
  </div>
</template>
<style>
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
  flex: auto
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



/**
 *From https://github.com/xtermjs/xterm.js/blob/master/css/xterm.css
 *
 * Copyright (c) 2014 The xterm.js authors. All rights reserved.
 * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
 * https://github.com/chjj/term.js
 * @license MIT
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Originally forked from (with the author's permission):
 *   Fabrice Bellard's javascript vt100 for jslinux:
 *   http://bellard.org/jslinux/
 *   Copyright (c) 2011 Fabrice Bellard
 *   The original design remains. The terminal itself
 *   has been extended to include xterm CSI codes, among
 *   other features.
 */

/**
 *  Default styles for xterm.js
 */

.xterm {
    position: relative;
    user-select: none;
    -ms-user-select: none;
    -webkit-user-select: none;
}

.xterm.focus,
.xterm:focus {
    outline: none;
}

.xterm .xterm-helpers {
    position: absolute;
    top: 0;
    /**
     * The z-index of the helpers must be higher than the canvases in order for
     * IMEs to appear on top.
     */
    z-index: 5;
}

.xterm .xterm-helper-textarea {
    padding: 0;
    border: 0;
    margin: 0;
    /* Move textarea out of the screen to the far left, so that the cursor is not visible */
    position: absolute;
    opacity: 0;
    left: -9999em;
    top: 0;
    width: 0;
    height: 0;
    z-index: -5;
    /** Prevent wrapping so the IME appears against the textarea at the correct position */
    white-space: nowrap;
    overflow: hidden;
    resize: none;
}

.xterm .composition-view {
    /* TODO: Composition position got messed up somewhere */
    background: #000;
    color: #FFF;
    display: none;
    position: absolute;
    white-space: nowrap;
    z-index: 1;
}

.xterm .composition-view.active {
    display: block;
}

.xterm .xterm-viewport {
    /* On OS X this is required in order for the scroll bar to appear fully opaque */
    background-color: #000;
    overflow-y: scroll;
    cursor: default;
    position: absolute;
    right: 0;
    left: 0;
    top: 0;
    bottom: 0;
}

.xterm .xterm-screen {
    position: relative;
}

.xterm .xterm-screen canvas {
    position: absolute;
    left: 0;
    top: 0;
}

.xterm .xterm-scroll-area {
    visibility: hidden;
}

.xterm-char-measure-element {
    display: inline-block;
    visibility: hidden;
    position: absolute;
    top: 0;
    left: -9999em;
    line-height: normal;
}

.xterm {
    cursor: text;
}

.xterm.enable-mouse-events {
    /* When mouse events are enabled (eg. tmux), revert to the standard pointer cursor */
    cursor: default;
}

.xterm.xterm-cursor-pointer,
.xterm .xterm-cursor-pointer {
    cursor: pointer;
}

.xterm.column-select.focus {
    /* Column selection mode */
    cursor: crosshair;
}

.xterm .xterm-accessibility,
.xterm .xterm-message {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    z-index: 10;
    color: transparent;
}

.xterm .live-region {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
}

.xterm-dim {
    opacity: 0.5;
}

.xterm-underline {
    text-decoration: underline;
}

.xterm-strikethrough {
    text-decoration: line-through;
}

.xterm-screen .xterm-decoration-container .xterm-decoration {
	z-index: 6;
	position: absolute;
}

.xterm-decoration-overview-ruler {
    z-index: 7;
    position: absolute;
    top: 0;
    right: 0;
}
</style>