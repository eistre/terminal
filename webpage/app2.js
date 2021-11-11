//const {host, password, port, username} = sshCreds;
//https://stackoverflow.com/questions/51886024/how-can-i-use-node-ssh2-to-start-a-user-interactive-ssh-session
const { Client } = require('ssh2');

return new Promise((resolve) => {
    var conn = new Client();
    conn.on('ready', function() {
        console.log('Client :: ready');
        conn.shell(function(err, stream) {
            if (err) throw err;

            const stdinListener = (data) => {
                skipNext = true;
                stream.stdin.write(data);
            };

            stream.on('close', function() {
                process.stdin.removeListener("data", stdinListener)
                conn.end();
                resolve();
            }).stderr.on('data', function(data) {
                resolve();
            });

            // skip next stops double printing of input
            let skipNext = false;
            stream.stdout.on("data", (data) => {
                if (skipNext) { return skipNext = false; }
                process.stdout.write(data);
            })

            process.stdin.on("data", stdinListener)
        });
    }).connect({
        host: 'localhost',
        port: 22,
        username: 'test',
        password: 'test',
    });
})