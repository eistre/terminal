require('dotenv').config();
var Docker = require('dockerode');


const fs = require('fs');
//Getting environment variables.
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
    context: __dirname + '/dockerStuff',
    src: ['Dockerfile']
}, {
    t: "autogen_ubuntu_ssh",
    buildargs: {
        usr:'test',
        pwd:'test',
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
        //Env: ['VAR=ttslkfjsdalkfj'],
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

//Iterating over port values
//Connecting all OS's with corresponding webpage.
for (var i = 0; i < 1; i=i+2) {
    var docker = new Docker({ port:22})
    let newport = (parseInt(port) + i).toString()
    docker.createContainer({
        Image: 'autogen_ubuntu_ssh',
        Tty: true,
        //Cmd: ['/bin/bash', '-c', 'service ssh start'],
        PortBindings: {
            "22/tcp": [{ HostPort: newport }]//Binding the internal ssh to outside port.
        },
    }, function (err, container) {
        container.start({}, function (err, data) {
            if (err){
                return ""
            }
            runExec(container);
        });
    });

//---------------------------------------------------------------
//Webpage side
//Creating the webpage and SSH into the OS via app.js in webpage.

    const child_process = require('child_process');
    newport = parseInt(newport)
    let outPort = newport+1
    var worker_process = child_process.fork("webpage/app.js", [host, newport, username, password, outPort]);
    worker_process.on('close', function (code) {
        console.log('child process exited with code ' + code);
    });
} 