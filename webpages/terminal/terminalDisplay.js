const HOST = '172.20.137.204'

/*
Boilerplate copied from https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
Credit goes to Avishek Acharya aka Elliot404
*/
var task3Progress = [false, false]
var task6Progress = false
window.addEventListener('load', function () {
  const terminalContainer = document.getElementById('terminal-container');
  const term = new Terminal({
    cursorBlink: true
  });
  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  term.open(terminalContainer);
  fitAddon.fit();

  const socket = io() //.connect();
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
      if (task3Progress[0]) {
        markTaskAsDone(3)
      }
      else task3Progress[1] = true
    }
    if (data.match(new RegExp('\\.ajutine/\\.h2sti_peidetud.*parool'))) {
      markTaskAsDone(4)
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
    if (data.match(new RegExp('.+inotifywait'))) {
      markTaskAsDone(10)
    }
    //console.log("ül1 hosts sisu leitud!")
    if (data.match('This system has been minimized by removing packages and content that are[\\s\\S]*not required on a system that users do not log into'))
      socket.emit('data','N\n')
    if (data.length > 3)//Might be useful
      console.log(data)//[Kfail[m[K[K:[m[K[01;31m[Knaidistekst[m[K
    if (data.startsWith('FromServer '))///home/test/ DELETE,ISDIR muumid
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
  if (doneTasks.includes(taskNr)){
    return;
  }
  else{
    doneTasks.push(taskNr)
    window.localStorage.setItem(port, JSON.stringify(doneTasks))
  
    openTask(taskNr+1)
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
  if (window.localStorage.getItem(port) === null) {
    openTask(1)
  }
  else {
    var doneTasks = JSON.parse(window.localStorage.getItem(port));
    for (var task in doneTasks) {
      markTaskAsDone(parseInt(doneTasks[task]));
    }
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