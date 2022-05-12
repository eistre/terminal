var net = require('net');
var Docker = require('dockerode');

//Build an image and wait for it to finish.
async function buildDockerImg() {
    var docker = new Docker({ port: 22 });
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

function runExec(container, command) {
    var options = {
        Cmd: ['bash', '-c', command],
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
 * @param {Number} port
 * @returns a promise with boolean response.
 * Code from https://stackoverflow.com/questions/29860354/in-nodejs-how-do-i-check-if-a-port-is-listening-or-in-use
 * Author :R. Bernstein (rocky)
 */
var portInUse = function (host, port) {
    return new Promise((response, reject) => {

        var server = net.createServer(function (socket) {
            socket.write('Echo server\r\n');
            socket.pipe(socket);
        });

        server.listen(port, host);
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
 * @param {String} userID
 * @returns Promise with containerInfo in array or error message.
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
            }).catch(err => { //if the error message is correct.
                reject(`No contatiner found for user ${userID}`);
            })
    });
}


/**
 * @param {String} containerID 
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
 * Makes a Ubuntu 20.04 container with given name and port if it's free.
 * @param {String} userID Name of the container to be created. In case of 'anonymous' the default name is set.
 * @param {String} containerHost
 * @param {Number} containerPort
 * @returns A promise with created container ID. Rejects if port was already used or docker has some internal error.
 */
function makeContainer(userID, containerHost, containerPort) {
    return new Promise((resolve, reject) => {
        portInUse(containerHost, containerPort)
            .then((isInUse) => {
                if (isInUse)
                    reject(`Port ${containerPort} was alerady used`)
                else {
                    //Funky hack to ensure webpage is also not used
                    portInUse(containerHost, containerPort + 1)
                        .then((isInUse) => {
                            if (isInUse)
                                reject(`Port ${containerPort} was alerady used`)
                            else {
                                //please remove the upper part with a proper fix.
                                var docker = new Docker({ port: 22 })
                                docker.createContainer({
                                    Image: 'autogen_ubuntu_ssh',
                                    Tty: true,
                                    name: userID === 'anonymous' ? "" : userID,
                                    HostConfig: {
                                        Memory: 512000000, // 512 Megabytes
                                        CpuPeriod: 100000, //default value.
                                        CpuQuota: 10000, // equals to maximum of 80% of 1 CPU core when running on 8 cores.
                                        PortBindings: {
                                            "22/tcp": [{ HostPort: containerPort.toString() }]
                                        },
                                    },
                                }, function (err, container) {
                                    container.start({}, function (err, data) {
                                        if (err) reject(err)
                                        runExec(container, 'service ssh start');
                                    });
                                    container.inspect((err, data) => {
                                        if (err) reject(err)
                                        resolve(data.Id)
                                    })
                                });
                            }
                        })
                }
            })
    });
}

/**
 * The main method of this file.
 * Ensures that the container is running and if it does not exist, creates the container.
 * @param {String} userID  
 * @param {String} containerID 
 * @param {String} containerHost
 * @param {Number} containerPort 
 * @returns Promise with dictonary containing status (function result), containerID and userName
 */
function handleContainer(userID, containerID, containerHost, containerPort) {
    return new Promise((resolve, reject) => {
        const isKnownUser = userID != "anonymous" //|| userID === undefined || userID === null
        if (containerID) {
            console.log("Searching for container via given cookie")
            ensureContainerIsRunning(containerID)
                .then(() => {
                    resolve({ 'status': 200, 'containerID': containerID, 'userName': userID, 'containerPort': containerPort })
                }).catch(err => {
                    console.log(err) //The container did not exist.
                    reject({ 'status': 404, 'containerID': null, 'userName': userID, 'containerPort': containerPort })
                });
        }
        else if (isKnownUser) {
            getContainerIdAndPortByUser(userID).then(idAndPort => {
                resolve({ 'status': 200, 'containerID': idAndPort[0], 'userName': userID, 'containerPort': idAndPort[1] })
            }).catch(err => {
                console.log(err)
                makeContainer(userID, containerHost, containerPort)
                    .then((containerId) => {
                        resolve({ 'status': 201, 'containerID': containerId, 'userName': userID, 'containerPort': containerPort })
                    }).catch((err) => {
                        console.log(err)
                        reject({ 'status': 403, 'containerID': null, 'userName': userID, 'containerPort': containerPort })
                    })
            });
        }
        else {
            console.log("Starting to make the Container")
            makeContainer(userID, containerHost, containerPort)
                .then((containerId) => {
                    resolve({ 'status': 201, 'containerID': containerId, 'userName': userID, 'containerPort': containerPort })
                }).catch((err) => {
                    console.log(err)
                    reject({ 'status': 403, 'containerID': null, 'userName': userID, 'containerPort': containerPort })
                })
        }
    });
}
/**
 * @param {String} containerID
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

function getAllContainersRunning() {
    return new Promise((resolve, reject) => {
        var docker = new Docker();
        var containerIDs = []
        docker.listContainers({ 'all': true }, function (err, containers) {
            if (err) reject(err)
            containers.forEach(function (containerInfo) {
                if (containerInfo.Image == 'autogen_ubuntu_ssh') {
                    containerIDs.push(containerInfo.Id)
                    if (containerInfo.State != 'running')
                        docker.getContainer(containerInfo.Id).start();
                }
            });
            resolve(containerIDs);
        });
        
    });
}

exports.getContainer = handleContainer;
exports.killContainerById = killContainerById;
exports.buildDockerImg = buildDockerImg;
exports.getAllContainersRunning = getAllContainersRunning;