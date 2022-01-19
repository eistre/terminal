require('dotenv').config();
var net = require('net');
var Docker = require('dockerode');


const fs = require('fs');
//Getting environment variables.
//TODO: instead of environmentals use user assigned or smthing.
let host = process.env.HOST;
let port = process.env.PORT;
let username = process.env.USERNAME;
let password = process.env.PASS;

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
                console.log(data);
            });
        });
    });
}


//Code from https://stackoverflow.com/questions/29860354/in-nodejs-how-do-i-check-if-a-port-is-listening-or-in-use
// Author :R. Bernstein (rocky)
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

function startIfClosed(containerID, isAnonymous) {
    return new Promise((resolve, reject) => {
        //Container was used before thus might need starting.
        if (containerID) {
            docker = new Docker()
            docker.getContainer(containerID).inspect((err, data) => {
                if (err) reject(err)
                if (data.State.Status == 'running') {
                    console.log(`There is no id ${data.Id} or name ${data.Name} but there is ${containerID}?`)
                    if (isAnonymous)
                        resolve({ containerID: data.Id, containerName: 'anonymous' });
                    else
                        resolve({ containerID: data.Id, containerName: data.Name });
                    return;
                }
                else {
                    docker.getContainer(containerID).start();
                    resolve({ containerID: data.Id, containerName: data.Name });
                    return;
                }
            })
        }
        else {
            console.log("Container does not yet exist.")
            resolve({ containerID: null, containerName: null });
        }
    });
}

function ensureContainerIsRunningOnPort(portNumber) {
    return new Promise((resolve, reject) => {
        new Docker().listContainers({ all: true }, (err, containers) => {
            containers.forEach((containerInfo) => {
                var isTargetContainer = containerInfo.Ports[0] && containerInfo.Ports[0].PublicPort == portNumber;
                if (isTargetContainer) {
                    if (containerInfo.State != 'running') {
                        //docker.getContainer(containerInfo.Id).rename({name:`NewTown${containerNumber}`})
                        docker.getContainer(containerInfo.Id).start();
                        console.log(`Restarted container ${containerInfo.Id} on port ${portNumber}`);
                    }
                    resolve({ containerID: containerInfo.Id, containerName: containerInfo.Names[0] });
                    return;
                }
            });
            reject(`No contatiner found on port ${portNumber}`);
        });
    })
}

//Iterating over port values
//Makes the container with requested port number.
function makeContainerForAnonymous(containerPort, containerID) {
    return new Promise((resolve, reject) => {

        console.log("Checking ports and closed containers")
        startIfClosed(containerID, isAnonymous = true).then(containerIDandName => {
            portInUse(containerPort).then((inUse) => {
                console.log(inUse ? "the port is used" : "port is not used")
                //Only if cookie proves that the container is knwon.
                if (inUse && containerIDandName.containerID) {
                    console.log(`Container ${containerIDandName.containerName} existed before!`)
                    resolve({ 'status': 200, 'containerID': containerIDandName.containerID, 'userName': containerIDandName.containerName })
                }
                else {
                    if (inUse)
                        reject(`Port ${containerPort} was alerady used`)
                    console.log("Creating new container")
                    var docker = new Docker({ port: 22 })
                    docker.createContainer({
                        Image: 'autogen_ubuntu_ssh',
                        Tty: true,
                        PortBindings: {
                            "22/tcp": [{ HostPort: containerPort.toString() }]//Binding the internal ssh to outside port.
                        },
                    }, function (err, container) {
                        container.start({}, function (err, data) {
                            if (err) {
                                return ""
                            }
                            runExec(container);
                        });
                        container.inspect((err, data) => {
                            resolve({ 'status': 201, 'containerID': data.Id, 'userName': 'anonymous' })
                        })
                    });
                }
            });
        })
    })
}

exports.makeContainer = makeContainerForAnonymous;
exports.portInUse = portInUse;