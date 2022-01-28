/*
Also copied from https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
Credit goes to Avishek Acharya aka Elliot404
*/
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
    //First Task
    if (data.match(/^test@[a-z\d]+:~\$ *$/))
      console.log("Esimene ülesanne tehtud!")
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

//TODO: write function that on window loading calls the 
// inotifywait -rm .  or inotifywait -rm /home/test/ command
//And for starters logs all of the output to console.
//Piirangud : ainult x arv subtreesid saab teha. Võivad tekkida protsessori aja probleemid?
var fileWatcher = function () {
  console.log("I exist.")
}
fileWatcher()