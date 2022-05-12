//template from: https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
//Credit goes to Elliot404
//Modifications made by Joonas Halapuu
function startWebSocketConnection(host, port, username, password, http) {
  const SSHClient = require('ssh2').Client;
  const io = require('socket.io')(http, {
    cors: {
      origin: "*"
    }
  });

  io.on('connection', function (socket) {
    var conn = new SSHClient();
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
        startWebSocketConnection(host, port, username, password, http); //fixes the slow loading
      }
    }).connect({
      host: host,
      port: port,
      username: username,
      password: password,
    });
  });

  function startShellSession(conn, socket) {
    conn.shell({ rows: 30, cols: 124 }, function (err, stream) {
      if (err)
        return socket.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
      socket.on('data', function (data) {
        stream.write(data);
      });
      stream.on('data', function (d) {
        socket.emit('data', d.toString('binary'));
      }).on('close', function () {
        conn.end();
      });
      socket.on('disconnecting', (reason) => {
        stream.write('exit\n');
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
    
}

exports.startWebSocketConnection = startWebSocketConnection;