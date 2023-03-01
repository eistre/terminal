const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()
const { Client } = require('pg');
require('dotenv').config();

/**
 * DB initsialization
 */

const dbConnection = new Client({
  password: "root",
  user: "root",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'root',
});
dbConnection.connect()
  .then(() => {
    console.log("Database is up!")
  });

exports.createOrGetUser = createOrGetUser;
exports.updateContainerInfo = updateContainerInfo;
exports.saveDoneTask = saveDoneTaskWithUserId;
exports.findDoneTasks = findDoneTasks;

async function createOrGetUser(name, matric) {
  const user = await findUserByMatric(matric)
  console.log("Found user "+ user+" With matric "+matric)
  if (user == null) {
    const newUser = await createUser(name, matric)
    return newUser
  } else {
    const newUser = await updateLoginTimeToNow(user.id)
    return newUser
  }
};

async function findUserByMatric(matric) {
  console.log("Finding user by matric "+matric)
  return await prisma.user.findFirst({
    where: {
        matriculation: matric
    },
  });
}

async function createUser(name, matric) {
  console.log("matrick "+matric)
  console.log(name)
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


async function updateContainerInfo(userId, newContainerId) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      containerId: newContainerId,
    },
  })
}

async function saveDoneTaskWithUserId(userId, taskNr) {
  return prisma.doneTask.create({
    data: {
      userId: userId,
      taskNr: taskNr,
    },
  })
}


async function findDoneTasks(Id) {
  return prisma.doneTask.groupBy({
    by: ['taskNr'],
    where: {
      userId: Id
    },
  }).catch(e => {
    console.log(e)
    return []
  });
}