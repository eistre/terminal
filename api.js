require('dotenv').config();
const express = require('express')
const app = express()
const PORT = 8080;
const routes = require('./routes')
const dockerController = require('./dockerController')
const Timer = require('./timer.js')
var cookieParser = require('cookie-parser')

app.use(cookieParser())
//From allowing cookies
//https://stackoverflow.com/questions/9071969/using-express-and-node-how-to-maintain-a-session-across-subdomains-hostheaders/14627464#14627464
// author : moka
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});

app.use(express.json()) //neccesary?

//Global variables
var StartingPort = 49152
var killTimers = {}

/**
 * @param {String} cookie 
 * @returns Second part of the string(cookie) split at % sign.
 */
function getPortNumber(cookie) {
  if (cookie === undefined || isNaN(Number(cookie.split('%')[1]))) {
    StartingPort += 2;
    return StartingPort - 2;
  }
  return Number(cookie.split('%')[1])
}


app.post('/ubuntuInstance/:userID', (req, res) => {
  /**
   * Updates the cookie and sends back the response.
   * @param {dict} containerInfo Information about the container (ContainerID, userName, status)
   * @param {Number} portNumber Port of the Ubuntu container.
   * @param {Number} exprMinFromNow  Minutes from now after which the cookie will expire
   */
  function sendResponse(containerInfo, portNumber, exprMinFromNow) {
    exprSecFromNow = exprMinFromNow * 60000
    res.cookie(`${containerInfo['userName']}`, `${containerInfo['containerID']}%${portNumber}`, { domain: process.env.HOST, path: '/', expires: new Date(Date.now() + exprSecFromNow)});
    res.status(containerInfo['status']).send({
      yourAddress: `http://${process.env.HOST}:${portNumber + 1}`,
    });
  }

  /**
   * Creates a new kill timer if one doesn't already exist but extends if it already exists.
   * @param {String} containerID ID of the container to be removed
   * @param {Number} exprMinFromNow Nr of minutes from now after which the container will be removed.
   */
  function updateKillTimers(containerID, exprMinFromNow) {
    //TODO: When web session is closed, stopp the container but do not kill. 
    //TODO: While session is open stop the timer.
    if (killTimers[containerID])
      killTimers[containerID].newTime(exprSecFromNow);

    else
      killTimers[containerID] = new Timer(exprMinFromNow * 60000, () => { dockerController.killContainerById(containerID); });
  }

  /**
   * Main function. Start all the other functions.
   * @param {String} userID User's ID. If not authenticated then anonymous.
   * @param {String} containerID  Containers ID. null if missing.
   * @param {Number} portNumber Containers port number.
   */
  function makeConnection(userID, containerID, portNumber) {
    //TODO: kontrollida et tüüp oleks õige ja viga visata muidu.'
    //TODO: kusagil kunagi - avab samas aknas.
    const cookieAndContainerExprInMin = 300
    dockerController.handleContainer(userID, containerID, portNumber)
      .then(containerInfo => {
        if (containerInfo['status'] == 201 || containerInfo['status'] == 200) {
          console.log(containerInfo['status'] == 201 ? `New container has been created.` : `Using an existing container`)
          portNumber = containerInfo['containerPort']
          routes.makeNewPage(portNumber + 1)
            .then(http => {
              connectToContainer(host = process.env.HOST, port = portNumber, username = 'test', password = 'test', http = http)
            }).then(() => {
              sendResponse(containerInfo, portNumber, exprMinFromNow = cookieAndContainerExprInMin);
              updateKillTimers(containerInfo['containerID'], exprMinFromNow = cookieAndContainerExprInMin);
              displayDataOnPage({ userID: userID, userName: name }, `/${portNumber}`)
            })
            .catch((error) => {
              console.log("Webpage already existed.")
              sendResponse(containerInfo, portNumber, exprMinFromNow = cookieAndContainerExprInMin);
              updateKillTimers(containerID, exprMinFromNow = cookieAndContainerExprInMin);
              displayDataOnPage({ userID: userID, userName: name }, `/${portNumber}`)
            })
        }
      }).catch((containerInfo) => {
        console.log(`Error code: ${containerInfo['status']}`)
        //Here we potentially loose 1 port if user had containerID but the actual container had a different ID.
        makeConnection(containerInfo['userName'], containerInfo['containerID'], getPortNumber(undefined))
      });
  }

  const { userID } = req.params;
  const name = req.body.name ? req.body.name : "anonymous";
  const portNumber = getPortNumber(req.cookies[userID]);
  const isCookieMissing = req.cookies[userID] === undefined;
  const containerID = isCookieMissing ? null : req.cookies[userID].split('%')[0]
  makeConnection(userID, containerID, portNumber);

})

function displayDataOnPage(data, pageUrl) {
  app.get(pageUrl, (req, res) => {
    res.json(data['userID'] === 'anonymous' ? { userID: 'anonymous' } : data)
  })
}

app.listen(
  PORT,
  //process.env.HOST,
  () => console.log(`API is live on http://${process.env.HOST}:${PORT}`)
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
      //Start file watch system to check for changes in /home/test/ directory.
      //conn.exec('inotifywait -rm /home/test/', (err, stream) => {  inotifywait -rm /home/test/
      conn.exec(`if pgrep -x "inotifywait" > /dev/null; then echo "running" > /dev/null; else inotifywait /home /home/test/ -m  ; fi`, (err, stream) => {
        if (err) console.log(err);
        stream.on('close', (code, signal) => {
          console.log("One instance of Inotify already exsisted")
        }).on('data', (data) => {
          socket.emit('data', 'FromServer ' + data)
        }).stderr.on('data', (data) => {
          console.log('STDERR: ' + data);
        });
      });
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