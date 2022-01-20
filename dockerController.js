require('dotenv').config();
var net = require('net');
var Docker = require('dockerode');
const fs = require('fs');

var docker = new Docker({
    // host: "http://127.0.0.14",
    port: 22,
    //ca: fs.readFileSync('ca.pem'),
    //cert: fs.readFileSync('cert.pem'),
    //key: fs.readFileSync('key.pem')
});

//Build an image and wait for it to finish.
docker.buildImage({
    context: __dirname,
    src: ['Dockerfile']
}, {
    t: "autogen_ubuntu_ssh",
    buildargs: {
        usr: 'test',
        pwd: 'test',
    }
}, function (err, response) {
    if (err) {
        console.log("Error!")
        console.log(err)
    }
    else {
        console.log("Ubuntu 20.04 has been built!");
    }
    //...
});
// Build has finished

function runExec(container) {
    var options = {
        Cmd: ['bash', '-c', 'service ssh start'],
        AttachStdout: true,
        AttachStderr: true
    };

    container.exec(options, function (err, exec) {
        if (err) return;
        exec.start(function (err, stream) {
            if (err) return;

            container.modem.demuxStream(stream, process.stdout, process.stderr);

            exec.inspect(function (err, data) {
                if (err) return;
                //console.log(data);
            });
        });
    });
}


/**
 * Checks if the port is used or not.
 * @param {Number} port port to be checked.
 * @returns a proomise with boolean response.
 * Code from https://stackoverflow.com/questions/29860354/in-nodejs-how-do-i-check-if-a-port-is-listening-or-in-use
 * Author :R. Bernstein (rocky)
 */
var portInUse = function (port) {
    return new Promise((response, reject) => {

        var server = net.createServer(function (socket) {
            socket.write('Echo server\r\n');
            socket.pipe(socket);
        });

        server.listen(port, 'localhost');
        server.on('error', function (e) {
            response(true);
            return true;
        });
        server.on('listening', function (e) {
            server.close();
            response(false);
            return false;
        });
    })
};

/**
 * Finds container ID when container name is given.
 * @param {String} userID name of the user what must match the containers name. Unique.
 * @returns Promise which resolves to containerID. Else rejected with error message.
 */
function getContainerIdByUser(userID) {
    return new Promise((resolve, reject) => {
        new Docker().listContainers({ all: true }, (err, containers) => {
            containers.forEach((containerInfo) => {
                var isTargetContainer = containerInfo.Names[0] == "/" + userID;
                if (isTargetContainer) {
                    if (containerInfo.State != 'running') {
                        docker.getContainer(containerInfo.Id).start();
                        console.log(`Restarted container ${containerInfo.Id} on port ${containerInfo.Ports[0].PublicPort}`);
                    }
                    resolve(containerInfo.Id);
                    return;
                }
            });
            reject(`No contatiner found for user ${userID}`);
        });
    })
}

/**
 * 
 * @param {String} containerID 
 * @returns Promise that rejects if container is not found, else resolves at nothing.
 */
function ensureContainerIsRunning(containerID) {
    return new Promise((resolve, reject) => {
        var docker = new Docker();
        docker.getContainer(containerID).inspect((err, data) => {
            if (err)
                reject(err);
            console.log(data.Name);
            if (data.State.Status == 'running')
                resolve();
            else {
                docker.getContainer(containerID).start();
                resolve();
                return;
            }
        });
    })
}

/**
 * Makes a Ubuntu 20.04 container with given name and open port if the port is free.
 * @param {String} userID Name of the container to be created. In case of 'anonymous' the default name is set.
 * @param {Number} containerPort Port to which the Ubuntu is open to.
 * @returns A promise with the created ContainerID and UserID. Rejects if port was already used or docker has some internal troubles.
 */
function makeContainer(userID, containerPort) {
    return new Promise((resolve, reject) => {
        portInUse(containerPort)
            .then((inUse) => {
                if (inUse)
                    reject(`Port ${containerPort} was alerady used`)
                else {
                    console.log("Creating new container")
                    var docker = new Docker({ port: 22 })
                    docker.createContainer({
                        Image: 'autogen_ubuntu_ssh',
                        Tty: true,
                        name: userID === 'anonymous' ? "" : userID,
                        PortBindings: {
                            "22/tcp": [{ HostPort: containerPort.toString() }]//Binding the internal ssh to outside port.
                        },
                    }, function (err, container) {
                        container.start({}, function (err, data) {
                            if (err) {
                                reject(err)
                                return ""
                            }
                            runExec(container);
                        });
                        container.inspect((err, data) => {
                            resolve({ 'status': 201, 'containerID': data.Id, 'userName': userID })
                        })
                    });
                }
            })
    });
}

/**
 * The main method of this file.
 * Ensures that the container is running and if it does not exist, creates the container.
 * @param {String} userID  
 * @param {String} containerID 
 * @param {Number} containerPort 
 * @returns Promise with dictonary containing status (function result), containerID and userName
 */
function handleContainer(userID, containerID, containerPort) {
    return new Promise((resolve, reject) => {
        const isKnownUser = userID != "anonymous" //|| userID === undefined || userID === null
        if (containerID) {
            ensureContainerIsRunning(containerID)
                .then(() => {
                    console.log(`Container ${containerID} existed before!`)
                    resolve({ 'status': 200, 'containerID': containerID, 'userName': userID })
                }).catch(err => {
                    console.log(err)
                    reject({ 'status': 404, 'containerID': null, 'userName': userID })
                });
        }
        else if (isKnownUser) {
            getContainerIdByUser(userID).then(newContainerID => {
                resolve({ 'status': 200, 'containerID': newContainerID, 'userName': userID })
            }).catch(err => {
                makeContainer(userID, containerPort)
                    .then((data) => {
                        resolve(data)
                    }).catch((err) => {
                        console.log(err)
                        reject({ 'status': 403, 'containerID': null, 'userName': userID })
                    })
            });
        }
        else {
            makeContainer(userID, containerPort)
                .then((data) => {
                    resolve(data)
                }).catch((err) => {
                    console.log(err)
                    reject({ 'status': 403, 'containerID': null, 'userName': userID })
                })
        }
    });
}
/**
 * Stops the container with given ID and removes it.
 * @param {String} containerID ID of the container to be removed.
 */
function killContainerById(containerID) {
    var container = new Docker().getContainer(containerID)
    container.stop()
        .then(data => {
            return container.remove();
        }).then(data => {
            console.log('container removed');
        }).catch(err => {
            console.log(err);
        });
}

exports.handleContainer = handleContainer;
exports.portInUse = portInUse;
exports.killContainerById = killContainerById;