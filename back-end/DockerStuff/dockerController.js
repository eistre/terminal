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
 * @param {String} userID
 * @returns Promise with containerInfo in array or error message.
 */
function getContainerIdByUser(userID) {
    return new Promise((resolve, reject) => {
        var docker = new Docker();
        docker.getContainer(userID).inspect()
            .then(containerInfo => {
                if (containerInfo.State.Status != 'running') {
                    docker.getContainer(userID).start();
                    console.log(`Restarted container ${containerInfo.Id}`);
                }
                resolve(containerInfo.Id);
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
 * @param {String} userID Name of the container to be created.
 * @returns A promise with created container ID. Rejects if port was already used or docker has some internal error.
 */
function makeContainer(userID) {
    return new Promise((resolve, reject) => {
        var docker = new Docker({ port: 22 })
        docker.createContainer({
            Image: 'autogen_ubuntu_ssh',
            Tty: true,
            name: userID,
            HostConfig: {
                Memory: 512000000, // 512 Megabytes
                CpuPeriod: 100000, //default value.
                CpuQuota: 10000, // equals to maximum of 80% of 1 CPU core when running on 8 cores.
                NetworkMode: 'ubuntuterminal_default',
            },
        }, function (err, container) {
            container.start({}, function (err, data) {
                if (err) {
                    reject(err)
                    return ""
                }
                runExec(container, 'service ssh start');
            });
            container.inspect((err, data) => {
                if (err) reject(err)
                resolve(data.Id)
            })
        });
    });
}

/**
 * The main method of this file.
 * Ensures that the container is running and if it does not exist, creates the container.
 * @param {String} userID  
 * @param {String} containerID 
 * @returns Promise with dictonary containing status (function result), containerID and userName
 */
function handleContainer(userID, containerID) {
    return new Promise((resolve, reject) => {
        if (containerID) {
            console.log("Searching for container via given cookie")
            ensureContainerIsRunning(containerID)
                .then(() => {
                    resolve({ 'status': 200, 'containerID': containerID, 'userName': userID })
                }).catch(err => {
                    console.log("Container has been expired or was invalid.")
                    console.log(err) //The container did not exist.
                    reject({ 'status': 404, 'containerID': null, 'userName': userID })
                });
        }
        else {
            getContainerIdByUser(userID).then(containerId => {
                resolve({ 'status': 200, 'containerID': containerId, 'userName': userID })
            }).catch(err => {
                console.log(err)
                makeContainer(userID)
                    .then((containerId) => {
                        resolve({ 'status': 201, 'containerID': containerId, 'userName': userID })
                    }).catch((err) => {
                        console.log(err)
                        reject({ 'status': 403, 'containerID': null, 'userName': userID })
                    })
            });
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

exports.getContainer = handleContainer;
exports.killContainerById = killContainerById;
exports.buildDockerImg = buildDockerImg;