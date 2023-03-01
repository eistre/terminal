require('dotenv').config();
const express = require('express')
const app = express();
const PORT = 8080;
const dockerController = require('./DockerStuff/dockerController')
const dbClient = require('./dbClient')
const Timer = require('./timer.js')
const sshConnection = require('./sshConnection')
const fs = require('fs');

// author : moka
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});
app.use(express.json()) //very neccesary!

//Start the docker thingy
dockerController.buildDockerImg().then(data => {
  console.log("Ubuntu 20.04 has been built!")
}).catch(err => {
  console.log(err)
});

//Global variables
var killTimers = {}



app.post('/ubuntuInstance/', async (req, res) => {
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
   * @param {String} containerID  Containers ID. null if missing.
   */
  function makeConnection(userID, containerID) {
    const cookieAndContainerExprInMin = 1440
    dockerController.getContainer(userID, containerID)
      .then(containerInfo => {
        if (containerInfo['status'] == 201 || containerInfo['status'] == 200) {
          console.log(containerInfo['status'] == 201 ? `New container has been created.` : `Using an existing container`)
          dbClient.updateContainerInfo(userID, containerInfo['containerID'])
          
          res.status(containerInfo['status']).send({
            userId: userID,
          });

          upsertKillTimer(containerInfo['containerID'], exprMinFromNow = cookieAndContainerExprInMin);
        }
      }).catch((containerInfo) => {
        //Should never end up in here :) due to DB unique port numbers.
        console.log(`Error code: ${containerInfo['status']}  \n ${containerInfo}`)
      });
  }

  const name = req.body.name;
  const matric = req.body.matriculation;
  console.log(`Got name ${name} and matriculation:${matric}`)
  const user = await dbClient.createOrGetUser(name, matric);
  console.log("User id is "+ user.id)
  makeConnection(user.id, user.containerId);
});


app.get("/tasksDone/:id", async (req, res) => {
  let id = req.params.id;
  const dbQuery = await dbClient.findDoneTasks(id);
  let taskArray = []
  dbQuery.forEach(dbElement => {
    taskArray.push(dbElement['taskNr'])
  });
  res.setHeader("Content-Type", "application/json");
  res.status(200);
  res.send(JSON.stringify(taskArray));
});

app.listen(PORT, 
  () => console.log(`API is live on port: ${PORT}`)
);