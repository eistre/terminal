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
async function buildImg() {

    let stream = await docker.buildImage({
        context: __dirname,
        src: ['Dockerfile']
    }, {
        t: "autogen_ubuntu_ssh",
        buildargs: {
            usr: 'test',
            pwd: 'Test1234',
        }
    })

    await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
    })
}
buildImg().then(data => {
    console.log("Ubuntu 20.04 has been built!")
}).catch(err => {
    console.log("Error!")
    console.log(err)
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

        server.listen(port, process.env.HOST);
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
function getContainerIdAndPortByUser(userID) {
    return new Promise((resolve, reject) => {
        var docker = new Docker();
        docker.getContainer(userID).inspect()
            .then(containerInfo => {
                if (containerInfo.State.Status != 'running') {
                    docker.getContainer(userID).start();
                    console.log(`Restarted container ${containerInfo.Id} on port ${containerInfo.HostConfig.PortBindings["22/tcp"][0].HostPort}`);
                }
                resolve([containerInfo.Id, parseInt(containerInfo.HostConfig.PortBindings["22/tcp"][0].HostPort)]);
                return;
            }).catch(err => {
                reject(`No contatiner found for user ${userID}`);
            })
    });
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
            if (data) {
                console.log(`Ensuring that container ${data.Name} is running`);
                if (data.State.Status == 'running')
                    resolve();
                else {
                    docker.getContainer(containerID).start();
                    resolve();
                    return;
                }
            }
            else
                reject(`Container with Id ${containerID} was not found!`)
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
                    var docker = new Docker({ port: 22 })
                    docker.createContainer({
                        Image: 'autogen_ubuntu_ssh',
                        //Cmd: ['/usr/sbin/init'],//for privileged
                        Tty: true,
                        name: userID === 'anonymous' ? "" : userID,
                        HostConfig: {
                            Memory: 512000000, // 512 Megabytes
                            CpuPeriod: 100000, //default value.
                            CpuQuota: 6250, // equals to maximum of 50% of 1 CPU core when running on 8 cores.
                            PortBindings: {
                                "22/tcp": [{ HostPort: containerPort.toString() }]//Binding the internal ssh to outside port.
                            },
                        },
                        //Privileged: true,//for privileged
                    }, function (err, container) {
                        container.start({}, function (err, data) {
                            if (err) {
                                reject(err)
                                return ""
                            }
                            runExec(container);
                        });
                        container.inspect((err, data) => {
                            //this is very bad...
                            resolve({ 'status': 201, 'containerID': data.Id, 'userName': userID, 'containerPort': containerPort })
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
            console.log("Searching for container via given cookie")
            ensureContainerIsRunning(containerID)
                .then(() => {
                    console.log(`Container ${containerID} existed before!`)
                    resolve({ 'status': 200, 'containerID': containerID, 'userName': userID, 'containerPort': containerPort })
                }).catch(err => {
                    console.log(err)
                    reject({ 'status': 404, 'containerID': null, 'userName': userID, 'containerPort': containerPort })
                });
        }
        else if (isKnownUser) {
            console.log("Searching for container by User ID")
            getContainerIdAndPortByUser(userID).then(idAndPort => {
                resolve({ 'status': 200, 'containerID': idAndPort[0], 'userName': userID, 'containerPort': idAndPort[1] })
            }).catch(err => {
                console.log(err)
                makeContainer(userID, containerPort)
                    .then((data) => {
                        resolve(data)
                    }).catch((err) => {
                        console.log(err)
                        reject({ 'status': 403, 'containerID': null, 'userName': userID, 'containerPort': containerPort })
                    })
            });
        }
        else {
            console.log("Starting to make the Container")
            makeContainer(userID, containerPort)
                .then((data) => {
                    resolve(data)
                }).catch((err) => {
                    console.log(err)
                    reject({ 'status': 403, 'containerID': null, 'userName': userID, 'containerPort': containerPort })
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
            console.log(`container ${containerID} removed`);
        }).catch(err => {
            console.log(err);
        });
}

exports.handleContainer = handleContainer;
exports.portInUse = portInUse;
exports.killContainerById = killContainerById;