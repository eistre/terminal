require('dotenv').config();
const SSHClient = require('ssh2').Client;
const dbClient = require('./dbClient')

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
      startShellSession(conn, socket, port);
      dbClient.saveDoneTask(port, 0)//Workaround for now.
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


function startShellSession(conn, socket, port) {
  conn.shell({ rows: 30, cols: 124 }, function (err, stream) {
    var userTryingToUnminimize = false;
    if (err)
      return socket.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
    socket.on('data', function (data) {
      stream.write(data);
    });
    stream.on('data', function (d) {
      checkTasks(d, port, socket);

      sendDataToFrontend(d, socket);
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

function sendDataToFrontend(d, socket) {
  var data = d.toString('binary');
  socket.emit('data', data);

}

function checkTasks(d, port, socket) {
  var data = d.toString('binary');

  var task3Progress = [false, false];
  var task6Progress = false;
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
    socket.emit('data', 'FromServer 1');
    dbClient.saveDoneTask(port, 1)
  }
  if (
    data.match(
      new RegExp("/home/test/ CREATE,ISDIR " + specificFolderRegex)
    )
  ) {
    socket.emit('data', 'FromServer 2');
    dbClient.saveDoneTask(port, 2)
  }
  if (data.match(new RegExp("test/\\.ajutine/\\.h2sti_peidetud"))) {
    // \\.veel1Failon2ra_peidetud
    if (task3Progress[1]) {
      socket.emit('data', 'FromServer 3');
      dbClient.saveDoneTask(port, 3)
    } else task3Progress[0] = true;
  }
  if (data.match(new RegExp("\\.veel1Failon2ra_peidetud"))) {
    if (
      task3Progress[0] &&
      !data.match(new RegExp("\\.sedaEiPeaksKuvamaMeidetud"))
    ) {
      socket.emit('data', 'FromServer 3');
      dbClient.saveDoneTask(port, 3)
    } else task3Progress[1] = true;
  }
  if (data.match(new RegExp("\\.sedaEiPeaksKuvamaMeidetud")))
    task3Progress = [false, false];
  if (data.match(new RegExp("Admin[\\s\\S]+parool[\\s\\S]+on Test1234"))) {
    //Selle peaks panema kuhugi süsteemifailide sügavusse. Siis vähem obvious. Nt etc kausta või kuhugi mujale lampi kohta. Kust ikkagi pääseb ilma sudota lugema või greppima vms. Tegelt päris hea mõte. Panna see kausta, mida ei saa lugeda.
    socket.emit('data', 'FromServer 4');
    dbClient.saveDoneTask(port, 4)
    //Boonus ülesanne -> kirjuta rida lõppu mis paljastab et ohoo tegelikult kaustas mis on ainult
  }
  if (data.match(new RegExp("/usr/bin/nano"))) {
    socket.emit('data', 'FromServer 5');
    dbClient.saveDoneTask(port, 5)
  }
  if (data.match(new RegExp("MODIFY andmeturve"))) {
    task6Progress = true;
  }
  if (data.match(new RegExp("-rw-rw----.*test.*root.*andmeturve"))) {
    if (task6Progress) {
      socket.emit('data', 'FromServer 6');
      dbClient.saveDoneTask(port, 6)
    }
  }
  if (data.match(new RegExp("^160526"))) {
    socket.emit('data', 'FromServer 7');
    dbClient.saveDoneTask(port, 7)
  }
  if (
    data.match(
      new RegExp("/home/ CREATE,ISDIR[\\s\\S]+/home/ ATTRIB,ISDIR")
    )
  ) {
    socket.emit('data', 'FromServer 8');
    dbClient.saveDoneTask(port, 8)
  }
  if (data.match(new RegExp("DELETE,ISDIR .ajutine"))) {
    socket.emit('data', 'FromServer 9');
    dbClient.saveDoneTask(port, 9)
  }
  if (data.match(new RegExp("\\d+.*\\d+:\\d+.*inotifywait"))) {
    socket.emit('data', 'FromServer 10');
    dbClient.saveDoneTask(port, 10)
  }
}