const express = require('express')
const app = express()
const PORT = 8080;
const routes = require('./routes')
const dockerController = require('./dockerController')
const Timer = require('./timer.js')
var cookieParser = require('cookie-parser')

app.use(cookieParser())
app.use(express.json()) //neccesary?

var StartingPort = 49152
var killTimers = {}

function getPortNumber(cookie) {
  if (cookie === undefined) {
    StartingPort += 2;
    return StartingPort - 2;
  }
  return Number(cookie.split('%')[1])
}


app.post('/ubuntuInstance/:userID', (req, res) => {
  function sendResponse(containerInfo, portNumber, exprMinFromNow) {
    exprSecFromNow = exprMinFromNow * 60000
    const containerID = containerInfo['containerID']
    res.cookie(`${containerInfo['userName']}`, `${containerID}%${portNumber}`, { expires: new Date(Date.now() + exprSecFromNow), httpOnly: true });
    res.status(containerInfo['status']).send({
      yourAddress: `http://localhost:${portNumber + 1}`,
    });
    //kill timer shananigans.
    /** var timer;
    if (killTimers[containerID]) {
      timer = killTimers[containerID]
      timer.newTime(exprSecFromNow)
    }
    else {
      timer = new Timer(exprSecFromNow, () => {
        dockerController.killContainerById(containerID)
      });
    }*/
    if (killTimers[containerID])
      killTimers[containerID].newTime(exprSecFromNow)
    else
      killTimers[containerID] = new Timer(exprSecFromNow, () => { dockerController.killContainerById(containerID) })
  }

  function makeConnection(userID, containerID, portNumber) {
    //TODO: kontrollida et tüüp oleks õige ja viga visata muidu.'
    //TODO: kusagil kunagi - avab samas aknas.
    dockerController.makeContainer(userID, containerID, portNumber).then(containerInfo => {

      if (containerInfo['status'] == 201 || containerInfo['status'] == 200) {
        console.log(containerInfo['status'] == 201 ? `New container has been created.` : `Using an existing container`)
        routes.makeNewPage(portNumber + 1).then(http => {//TODO: get the user/password from user.
          connectToContainer(host = '127.0.0.1', port = portNumber, username = 'test', password = 'test', http = http).then(() => {
            sendResponse(containerInfo, portNumber, exprMinFromNow = 0.25);
          })
        }).catch((error) => {
          console.log("Webpage already existed.")
          sendResponse(containerInfo, portNumber, exprMinFromNow = 0.25);
        })
      }
      //TODO: Check if container has stopped, start it up again.
    }).catch((error) => {
      //aka log error and try again.
      console.log(error)
      //if authenticated port was already used we need to check if named container exists and if not then create it.
      makeConnection('anonymous', null, getPortNumber(undefined))
    });
  }

  //if it is to anonymous
  //if it is to certain user.
  const { userID } = req.params;
  const isCookieMissing = req.cookies[userID] === undefined;
  const portNumber = getPortNumber(req.cookies[userID]);
  const containerID = isCookieMissing ? null : req.cookies[userID].split('%')[0]
  makeConnection(userID, containerID, portNumber);

})

app.listen(
  PORT,
  () => console.log(`it's alive on http://localhost:${PORT}`)
)



//Still bad practice. is here now for convenience. TODO: cleanup later.
//copy-pasted from: https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
//Credit goes to Elliot404
//SSH connection.
function connectToContainer(host, port, username, password, http) {
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
      conn.shell(function (err, stream) {
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
      });
    }).on('close', function () {
      socket.emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');
    }).on('error', function (err) {
      socket.emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
    }).connect({
      host: host,
      port: port,
      username: username,
      password: password,
    });
  });
}