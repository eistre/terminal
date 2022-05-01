require('dotenv').config();
const express = require('express')
const app = express()
const PORT = 8080;
const routes = require('./routes')
const dockerController = require('./dockerController')
const Timer = require('./timer.js')
const sshConnection = require('./sshConnection')
const fs = require('fs');
var cookieParser = require('cookie-parser')

app.use(cookieParser())
//From allowing cookies
//https://stackoverflow.com/questions/9071969/using-express-and-node-how-to-maintain-a-session-across-subdomains-hostheaders/14627464#14627464
// author : moka
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});
app.use(express.json()) //very neccesary!

//Start the webpage thingy
routes.makeNewPage(process.env.HOST, 80);
//Start the docker thingy
dockerController.buildDockerImg().then(data => {
  console.log("Ubuntu 20.04 has been built!")
}).catch(err => {
  console.log("Error!")
  console.log(err)
});

//Global variables
var StartingPort = 49152
var killTimers = {}

/**
 * @param {String} cookie 
 * @returns Second part of the string (cookie) split at % sign.
 */
function getPortNumber(cookie) {
  if (cookie === undefined || isNaN(Number(cookie.split('%')[1]))) {
    if (StartingPort >= 65530)//infinite loop, possible place for DDOS attack.
      StartingPort = 49152
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
    console.log(`Sending response: ${containerInfo['ContainerID']},${containerInfo['userName']},${containerInfo['status']}, ${portNumber}`)
    exprSecFromNow = exprMinFromNow * 60000
    res.cookie(`${containerInfo['userName']}`, `${containerInfo['containerID']}%${portNumber}`, { domain: process.env.HOST, path: '/', expires: new Date(Date.now() + exprSecFromNow) });
    res.status(containerInfo['status']).send({
      yourAddress: `http://${process.env.HOST}:${portNumber + 1}`,
    });
  }

  /**
   * Creates a new kill timer if one doesn't already exist but extends if it already exists.
   * @param {String} containerID
   * @param {Number} exprMinFromNow
   */
  function upsertKillTimer(containerID, exprMinFromNow) {
    //TODO: When web session is closed, stopp the container but do not kill. 
    //TODO: While session is open stop the timer.
    if (killTimers[containerID])
      killTimers[containerID].newTime(exprSecFromNow);

    else
      killTimers[containerID] = new Timer(exprMinFromNow * 60000, () => { dockerController.killContainerById(containerID); });
  }

  /**
   * @param {String} userID User's ID. If not authenticated then anonymous.
   * @param {String} containerID  Containers ID. null if missing.
   * @param {Number} portNumber Containers port number.
   */
  function makeConnection(userID, containerID, portNumber, recursiveDepth = 0) {
    const cookieAndContainerExprInMin = 1440
    dockerController.getContainer(userID, containerID, portHost = process.env.HOST, portNumber)
      .then(containerInfo => {
        if (containerInfo['status'] == 201 || containerInfo['status'] == 200) {
          console.log(containerInfo['status'] == 201 ? `New container has been created.` : `Using an existing container`)
          portNumber = containerInfo['containerPort']
          sshConnection.startWebSocketConnection(host = process.env.HOST, port = portNumber, username = 'test', password = 'Test1234')
          sendResponse(containerInfo, portNumber, exprMinFromNow = cookieAndContainerExprInMin);
          upsertKillTimer(containerInfo['containerID'], exprMinFromNow = cookieAndContainerExprInMin);
          linkUserInfo({ userID: userID, userName: name }, `/${portNumber}`)
        }
      }).catch((containerInfo) => {
        console.log(`Error code: ${containerInfo['status']}  \n ${containerInfo}`)
        //Here we potentially loose 1 port if user had containerID but the actual container had a different ID.
        if (recursiveDepth > 0) {
          res.status(508).send(
            `Proovitud ${recursiveDepth} erineva pordi peal ning kõik olid juba kasutuses! Andke veast teada lehe haldajale.`);
        }
        else
          makeConnection(containerInfo['userName'], containerInfo['containerID'], getPortNumber(undefined), recursiveDepth + 1)
      });
  }

  const { userID } = req.params;
  const name = req.body.name ? req.body.name : "anonymous";
  const portNumber = getPortNumber(req.cookies[userID]);
  const isCookieMissing = req.cookies[userID] === undefined;
  const containerID = isCookieMissing ? null : req.cookies[userID].split('%')[0]
  makeConnection(userID, containerID, portNumber);

})

app.put('/logger', (req, res) => {
  //Logs all authorized users tasks with timestamps to file.
  var matric = req.body.matriculation
  var taskNr = req.body.taskNr

  fs.writeFile('./taskCompletions.log', `${Date.now()},${matric},${taskNr}\n`, { flag: 'a+' }, function (err) {
    if (err) {
      console.log(err)
      res.status(400).send("Could not save logs!")
    }
    res.status(200).send("OK");
  });
})

function linkUserInfo(data, pageUrl) {
  app.get(pageUrl, (req, res) => {
    res.json(data['userID'] === 'anonymous' ? { userID: 'anonymous' } : data)
  })
}

app.listen(PORT, process.env.HOST,
  () => console.log(`API is live on http://${process.env.HOST}:${PORT}`)
)