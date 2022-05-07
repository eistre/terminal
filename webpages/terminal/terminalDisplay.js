const HOST = '172.18.55.145'


/*
Boilerplate copied from https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
Credit goes to Avishek Acharya aka Elliot404
*/
var task3Progress = [false, false]
var task6Progress = false
window.addEventListener('load', function () {
  //TerminalStuff
  //From https://xtermjs.org/
  var baseTheme = {
    foreground: '#F8F8F8',
    background: '#2D2E2C',
    selection: '#5DA5D533',
    black: '#1E1E1D',
    brightBlack: '#262625',
    red: '#CE5C5C',
    brightRed: '#FF7272',
    green: '#5BCC5B',
    brightGreen: '#72FF72',
    yellow: '#CCCC5B',
    brightYellow: '#FFFF72',
    blue: '#5D5DD3',
    brightBlue: '#7279FF',
    magenta: '#BC5ED1',
    brightMagenta: '#E572FF',
    cyan: '#5DA5D5',
    brightCyan: '#72F0FF',
    white: '#F8F8F8',
    brightWhite: '#FFFFFF'
  };


  const term = new Terminal({
    fontFamily: '"Cascadia Code", Menlo, monospace',
    //theme: baseTheme,
    cursorBlink: true,
    rows: 30,
    cols: 124,
  });
  //const fitAddon = new window.FitAddon.FitAddon();
  const webgl = new window.WebglAddon.WebglAddon();

  const socket = io() //.connect();
  //  term.loadAddon(fitAddon);
  term.open(document.getElementById('terminal-container'));
  term.loadAddon(webgl);
  term.onResize(function (evt) {
    socket.send({ cols: evt.cols });
  });
  //  fitAddon.fit()

  document.querySelector('.xterm').addEventListener('wheel', e => {
    if (term.buffer.active.baseY > 0) {
      e.preventDefault();
    }
  });

  socket.on('connect', function () {
    term.write('\r\n*** Connected to backend ***\r\n');
  });

  // Browser -> Backend //allows copy paste as well with ctrl + shift + v
  term.onData((data) => {
    socket.emit('data', data);
  });

  // Backend -> Browser
  socket.on('data', function (data) {
    //Automatic correct results check for tasks
    const specificFolderRegex = '(?=.*[a-z])(?=.*\\d)(?=.*[ ])(?=.*[\\<\\>\\=])(?=.*[\\.\\!\\?])'
    //First Task
    if (data.match(new RegExp('^127\\.0\\.0\\.1[\\s\\S]*localhost[\\s\\S]*ip6-localhost[\\s\\S]*localnet[\\s\\S]*allnodes[\\s\\S]*allrouters'))) {
      markTaskAsDone(1)
    }
    if (data.match(new RegExp('/home/test/ CREATE,ISDIR ' + specificFolderRegex))) {
      markTaskAsDone(2)
    }
    if (data.match(new RegExp('test/\\.ajutine/\\.h2sti_peidetud'))) {// \\.veel1Failon2ra_peidetud
      if (task3Progress[1]) {
        markTaskAsDone(3)
      }
      else task3Progress[0] = true
    }
    if (data.match(new RegExp('\\.veel1Failon2ra_peidetud'))) {
      if (task3Progress[0] && !data.match(new RegExp('\\.sedaEiPeaksKuvamaMeidetud'))) {
        markTaskAsDone(3)
      }
      else task3Progress[1] = true
    }
    if (data.match(new RegExp('\\.sedaEiPeaksKuvamaMeidetud')))
      task3Progress = [false, false]
    if (data.match(new RegExp('Admin[\\s\\S]+parool[\\s\\S]+on Test1234'))) { //Selle peaks panema kuhugi süsteemifailide sügavusse. Siis vähem obvious. Nt etc kausta või kuhugi mujale lampi kohta. Kust ikkagi pääseb ilma sudota lugema või greppima vms. Tegelt päris hea mõte. Panna see kausta, mida ei saa lugeda.
      markTaskAsDone(4)//Boonus ülesanne -> kirjuta rida lõppu mis paljastab et ohoo tegelikult kaustas mis on ainult 
    }
    if (data.match(new RegExp('/usr/bin/nano'))) {
      markTaskAsDone(5)
    }
    if (data.match(new RegExp('MODIFY andmeturve'))) {
      task6Progress = true
    }
    if (data.match(new RegExp('-rw-rw----.*test.*root.*andmeturve'))) {
      if (task6Progress) {
        markTaskAsDone(6)
      }
    }
    if (data.match(new RegExp('^160526'))) {
      markTaskAsDone(7)
    }
    if (data.match(new RegExp('/home/ CREATE,ISDIR[\\s\\S]+/home/ ATTRIB,ISDIR'))) {
      markTaskAsDone(8)
    }
    if (data.match(new RegExp('DELETE,ISDIR .ajutine'))) {
      markTaskAsDone(9)
    }
    if (data.match(new RegExp('\\d+.*\\d+:\\d+.*inotifywait'))) {
      markTaskAsDone(10)
    }

    //For live debugging
    if (data.length > 3)//Not user typing
      console.log(data)
    if (data.startsWith('FromServer ')) //inotify messages
      console.log(data)
    else
      term.write(data);
  });

  socket.on('disconnect', function () {
    term.write('\r\n*** Disconnected from backend ***\r\n');
  });
}, false);


//By W3Schools 
//From https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_collapsible_symbol
//For collapsible tasks
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


function logTask(matriculation, taskNr) {
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true; //so the cookies can be used.
  if (matriculation) {
    xhr.open("PUT", `http://${HOST}:8080/logger`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ "matriculation": matriculation, "taskNr": taskNr }));
  }
}

function markTaskAsDone(taskNr) {
  taskButton = document.getElementsByClassName("collapsible")[taskNr - 1]
  taskButton.style.background = 'green'
  var content = taskButton.nextElementSibling;
  if (content.style.maxHeight) {
    taskButton.classList.toggle("active");
    content.style.maxHeight = null;
  }
  const port = window.location.port
  var doneTasks = window.localStorage.getItem(port) === null ? [] : JSON.parse(window.localStorage.getItem(port));
  if (doneTasks.includes(taskNr)) {
    openTask(taskNr + 1)
  }
  else {
    doneTasks.push(taskNr)
    window.localStorage.setItem(port, JSON.stringify(doneTasks))
    const matriculation = document.getElementById('matriculation').getElementsByTagName('strong')[0].innerHTML
    if (matriculation) {
      logTask(matriculation, taskNr)
    }

    openTask(taskNr + 1)
  }
}
function openTask(taskNr) {
  if (taskNr > 10) return
  taskButton = document.getElementsByClassName("collapsible")[taskNr - 1]
  if (taskButton.style.background === 'green') openTask(taskNr + 1)
  else {
    var content = taskButton.nextElementSibling;
    if (!content.style.maxHeight) {
      taskButton.classList.toggle("active");
      content.style.maxHeight = content.scrollHeight + "px";
    }
  }
}

function markTasksAlreadyDone() {
  const port = window.location.port
  openTask(1)

  var doneTasks = JSON.parse(window.localStorage.getItem(port));
  for (var task in doneTasks) {
    markTaskAsDone(parseInt(doneTasks[task]));
  }
}
window.onload = () => {
  console.log(window.location.port)
  fetch(`http://${HOST}:8080/${window.location.port - 1}`)
    .then(response => response.json())
    .then(data => {
      if (data['userID'] == 'anonymous') {
        document.getElementById('name').getElementsByTagName('strong')[0].innerHTML = "külaline"
        document.getElementById('matriculation').style.display = "none";
      }
      else {
        document.getElementById('matriculation').getElementsByTagName('strong')[0].innerHTML = data['userID']
        document.getElementById('name').getElementsByTagName('strong')[0].innerHTML = data['userName']
      }
    })
  markTasksAlreadyDone()
}