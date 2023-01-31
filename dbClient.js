const { Client } = require('pg');
const { app, PORT } = require("./api");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()
/**
 *
 * DB initalization and usage
 *
*/

/*
async function main() {
  // ... you will write your Prisma Client queries here
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
*/


const dbClient = new Client({
  password: "root",
  user: "root",
  host: process.env.HOST,
  port: 5432,
  database: 'root',
});


(async () => {
  await dbClient.connect();

  app.listen(PORT, process.env.HOST,
    () => console.log(`API is live on http://${process.env.HOST}:${PORT}`)
  );
})();

async function getUserIdByPort(port) {
  console.log("Finding port ",port)
  var intPort = parseInt(port)
  if (isNaN(intPort))
    return 0
  user = await prisma.user.findFirst({
    where:
      { port: intPort },

  });
  return user.id
}


async function saveDoneTask(port, taskNr) {  //Logs all authorized users tasks with timestamps to db.
  id = await getUserIdByPort(port)
  console.log("Logging " + id + " has done " + taskNr)
  if (validInputs(id, taskNr)) {
    const saveDoneTask = await prisma.doneTask.create({
      data: {
        userId: id,
        taskNr: taskNr,
      },
    });
    console.log(saveDoneTask);
  }
  else {
    console.log("Inputs " + id + "; " + taskNr + " were not numerical.");
  }
}
/* const results = await dbClient
      .query(`INSERT INTO DoneTasks(userId, taskNr, completionTtime) VALUES('${id}', ${taskNr}, now());`)
      .then((payload) => {
        console.log("Inserted into DoneTasks: " + payload.rows[0]);
        return "OK";
      })
      .catch(err => {
        console.log(err);
        res.status(400).send("Could not save logs!");
      });*/


function validInputs(id) {
  return isNumeric(id);
}


function isNumeric(value) {
  return /^\d+$/.test(value);
}

// returns  name, matric, port and string of tasks done for given user ID.
app.get("/users/", async (req, res) => {
  let id = req.query.id;
  const results = await getIdFromData(id);
  if (results.length < 1) res.status(404).send("Could get tasks for user " + id);
  res.setHeader("Content-Type", "application/json");
  res.status(200);
  res.send(JSON.stringify(results));
});

async function getIdFromData(id) {
  validInputs(id);
  const results = await dbClient
    .query(`SELECT name, matriculation, port, taskNumbers FROM public."User"
    JOIN  (SELECT DoneTasks.userId, string_agg(DoneTasks.taskNr || '', ',') As taskNumbers FROM DoneTasks GROUP BY DoneTasks.userId)
    DoneTasks ON User.id=userId
    WHERE userId = ${id};`)
    .then((payload) => {
      return payload.rows[0];
    })
    .catch(err => {
      console.log(err);
    });
  return results;
}

app.post("/new_user/", async (req, res) => {
  let name = req.query.name;
  let matric = req.query.matric;

  const results = await createAndReturnUser(name, matric);
  console.log(results)
  if (results == null) res.status(404).send("Could get tasks for user " + name);
  else {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    res.send(JSON.stringify(results));
  }
});

///create if not exists account
async function createAndReturnUser(name, matric) {
  const user = await findUser(name, matric)
  if (user == null) {
    const newUser = await createUser(name, matric)
    return newUser
  } else {
    const id = user
    const newUser = await updateLoginTimeToNow(id.id)
    return newUser
  }
};



async function createUser(name, matric) {
  return await prisma.user.create({
    data: {
      name: name,
      matriculation: matric,
    },
  });
}

async function updateLoginTimeToNow(id) {
  return prisma.user.update({
    where: {
      id: id,
    },
    data: {
      lastLogin: new Date().toISOString(),
    },
  });
}

async function findUser(name, matric) {
  return await prisma.user.findFirst({
    where: {
      AND: [
        { name: name },
        { matriculation: matric }
      ]
    },
  });
}

async function updateContainerInfo(userId, newPort, newContainerId) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      port: newPort,
      containerId: newContainerId,
    },
  });
}

/*function updateLoginAndRetrunId(payload) {
  dbClient.query(`UPDATE public."User" SET lastLogin = now() WHERE id = '${payload.rows[0].id}'`)
    .catch(err => { console.log(err); });
  return payload.rows[0].id;
}

function createAndReturnId(matric, name) {
  return dbClient
    .query(`INSERT INTO public."User"(matriculation, name, port) VALUES('${matric}', '${name}', 213);`)
    .then(() => {
      return dbClient
        .query(`SELECT id FROM public."User" where name='${name}' and matriculation='${matric}';`)
        .then((new_payload) => {
          console.log(new_payload.rows[0]);
          return new_payload.rows[0].id;
        });
    });
}
 const results = await dbClient
 .query(`SELECT * FROM donetasks where user_id='${id}';`)
 .then((payload) => {
   return payload.rows;
 })
 .catch(err => {
   console.log(err);
   res.status(400).send("Could get tasks for user " + id);
 });
if (results.length < 1) res.status(404).send("Could get tasks for user " + id);
console.log(results)
res.setHeader("Content-Type", "application/json");
res.status(200);
res.send(JSON.stringify(results));
});*/


////////////////////////////////////

/*
* What do I need to do? 
*
*  post user_name, matric <- returns id
*  
*  go to terminal/?id=id
*  get /user?=id returns all done tasks of id and name, matriculation
*
*  What is done?
*
* Task logging  ->  I = ... have done task ... it will be in db. <- saving data of done tasks
* Getting tasks ->  I = ... have done tasks ...                  <- loading data for users
*
*
*
* Thus the flow is following. If we have you in db -> we'll connect you right on. Take a seat in terminal/uid?=x
*                             If you're new        -> create new person with name .. (and matric ..) -> 
*         --------------->    We'll connect your right on. take a seat in ...
*
*
* Give me matriculation nr and this is your Id that you can connect to?? 
* Later. Or give me your Id for guests.
*
**
*/

exports.getUser = createAndReturnUser;
exports.updateContainerInfo = updateContainerInfo;
exports.saveDoneTask = saveDoneTask;