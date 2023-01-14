require('dotenv').config();
const SSHClient = require('ssh2').Client;

const io = require('socket.io')(5000, {
  cors: {
    origin: [`http://${process.env.HOST}:80`, `http://${process.env.HOST}:8080`, `http://${process.env.HOST}`],
  }
});

//template from: https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
//Credit goes to Elliot404
//Modifications made by Joonas Halapuu
const host = process.env.HOST
const username = 'test'
const password = 'Test1234'

io.on('connection', socket => {
  socket.on('connect to port', port => {
    var conn = new SSHClient();
    //socket.join(socketKey);
    conn.on('ready', function () {
      socket.emit('data', '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
      startInotify(conn, socket);
      startShellSession(conn, socket);
    }).on('close', function () {
      socket.emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');
      socket.disconnect();
    }).on('error', function (err) {
      socket.emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
      if (err.message.startsWith('connect ECONNREFUSED')) {
        socket.emit('data', "To fix, reload the page!");
        //startWebSocketConnection(host, port, username, password); //I think this fixes the slow loading and not connecting at first error
      }
    }).connect({
      host: host,
      port: port,
      username: username,
      password: password,
    });
  })
});

//socket.on('disconnect', function () {
//need to call exit() command if SSH is still running.
//});


function startShellSession(conn, socket) {
  conn.shell({ rows: 30, cols: 124 }, function (err, stream) {
    var userTryingToUnminimize = false;
    if (err)
      return socket.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
    socket.on('data', function (data) {
      stream.write(data);
    });
    stream.on('data', function (d) {
      userTryingToUnminimize = sendDataToFrontend(d, userTryingToUnminimize, stream, socket);
    }).on('close', function () {
      conn.end();
    });
  });
}

function startInotify(conn, socket) {
  conn.exec(`inotifywait /home /home/test/ -m`, (err, stream) => {
    if (err)
      console.log(err);
    stream.on('close', (code, signal) => {
      console.log("inotify instance closed.");
    }).on('data', (data) => {
      socket.emit('data', 'FromServer ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}

function sendDataToFrontend(d, userTryingToUnminimize, stream, socket) {
  const unminimizeResponse1 = 'This script restores content and packages that are found on a default';
  const unminimizeResponse2 = 'Ubuntu server system in order to make this system more suitable for';
  var data = d.toString('binary');
  if (data.includes(unminimizeResponse2) && (userTryingToUnminimize || data.includes(unminimizeResponse1))) {
    userTryingToUnminimize = false;
    stream.write('\nThis command has been disabled.\n');
  }
  else if (data.includes(unminimizeResponse1)) {
    userTryingToUnminimize = true;
  }
  else {
    userTryingToUnminimize = false;
    socket.emit('data', data);
  }
  return userTryingToUnminimize;
}