require('dotenv').config();
var Docker = require('dockerode');


const fs = require('fs');
//Getting environment variables.
let host = process.env.HOST;
let port = process.env.PORT;
let username = process.env.USERNAME;
let password = process.env.PASS;
let outPort = process.env.OUTPORT;

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
}, function (err, response) {
    if (err) {
        console.log("viga")
        console.log(err)
    }
    else {
        console.log("olemas!");

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

for (var i = 0; i < 10; i++) {
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
};

//---------------------------------------------------------------
//Ühenduse loomine veebilehe kaudu

const child_process = require('child_process');
for (var i = 0; i < 10; i++) {
    let newport = parseInt(port) + i
    let newoutPort = parseInt(outPort) + i
    var worker_process = child_process.fork("webpage3.0/app.js", [host, newport, username, password, newoutPort]);
    worker_process.on('close', function (code) {
        console.log('child process exited with code ' + code);
    });
} 