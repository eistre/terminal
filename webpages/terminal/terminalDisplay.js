/*
Boilerplate copied from https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
Credit goes to Avishek Acharya aka Elliot404
*/
var task8Progress = [false, false]
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

  //TODO: võiks saada ka hosts asju muuta ning kui mitu korda lehte avada siis ikkagi oleks ainult üks intoifywait protsess.
  //TODO: kus võimalik peaks testima ka failide avamist lisaks käsu väljundile 8nda ülesande stiilis
  // Backend -> Browser
  socket.on('data', function (data) {
    //Automatic correct results check for tasks
    const specificFolderRegex = '(?=.*[a-z])(?=.*\\d)(?=.*[ ])(?=.*[\\<\\>\\=])(?=.*[\\.\\!\\?])'
    //First Task
    if (data.match(new RegExp('^127\\.0\\.0\\.1[\\s\\S]*localhost[\\s\\S]*ip6-localhost[\\s\\S]*localnet[\\s\\S]*allnodes[\\s\\S]*allrouters'))) {
      markTaskAsDone(1)
      openTask(2)
    }
    if (data.match(new RegExp('/home/test/ CREATE,ISDIR ' + specificFolderRegex))) {
      markTaskAsDone(2)
      openTask(3)
    }
    if (data.match(new RegExp('/\\.h2sti_peidetud'))) {
      markTaskAsDone(3)
      openTask(4)
    }
    if (data.match(new RegExp('\\.h2sti_peidetud.*parool'))) {
      markTaskAsDone(4)
      openTask(5)
    }
    if (data.match(new RegExp('/usr/games/sl'))) {
      markTaskAsDone(5)
      openTask(6)
    }
    if (data.match(new RegExp('^160526'))) {
      markTaskAsDone(6)
      openTask(7)
    }
    if (data.match(new RegExp('/home/test/' + specificFolderRegex + '(?=.*/ DELETE_SELF)'))) {
      task8Progress[0] = true
      console.log('esimene osa tehtud"')
      console.log(task8Progress)
      if (task8Progress[1]) {
        markTaskAsDone(8)
        openTask(9)
      }
    }
    if (data.match(new RegExp('/home/test/ DELETE .h2sti_peidetud'))) {
      task8Progress[1] = true
      console.log(task8Progress)
      console.log("Teine osa tehtud!")
      if (task8Progress[0]) {
        markTaskAsDone(8)
        openTask(9)
      }
    }
    if (data.match(new RegExp('.+inotifywait'))) {
      markTaskAsDone(9)
      openTask(10)
    }
    //console.log("ül1 hosts sisu leitud!")
    if (data.match(/\[Kfail.*:.*naidistekst/))
      console.log("Leidsite näidisteksti üles!")
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


window.onload = () => {
  console.log(window.location.port)
  fetch(`http://localhost:8080/${window.location.port - 1}`)
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
}

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
}
function openTask(taskNr) {
  if (taskNr > 10) return
  taskButton = document.getElementsByClassName("collapsible")[taskNr - 1]
  if (taskButton.style.background == 'green') openTask(taskNr + 1)
  else {
    var content = taskButton.nextElementSibling;
    if (!content.style.maxHeight) {
      taskButton.classList.toggle("active");
      content.style.maxHeight = content.scrollHeight + "px";
    }
  }
}

openTask(1)