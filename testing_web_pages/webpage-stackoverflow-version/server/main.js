const server = require('http').createServer();
// https://github.com/mscdex/ssh2
const io = require('socket.io')(server);
const SSHClient = require('ssh2').Client;

Meteor.startup(() => {
    io.on('connection', (socket) => {
        const conn = new SSHClient();
        conn.on('ready', () => {
            console.log('*** ready');
            socket.emit('data', '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
            conn.shell((err, stream) => {
                if (err) {
                    return socket.emit('data', `\r\n*** SSH SHELL ERROR: ' ${err.message} ***\r\n`);
                }
                socket.on('data', (data) => {
                    stream.write(data);
                });
                stream.on('data', (d) => {
                    socket.emit('data', d.toString('binary'));
                }).on('close', () => {
                    conn.end();
                });
            });
        }).on('close', () => {
            socket.emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');
        }).on('error', (err) => {
            socket.emit('data', `\r\n*** SSH CONNECTION ERROR: ${err.message} ***\r\n`);
        }).connect({
            host: 'localhost',
            port: 22,
            username: 'test',
            password: 'test',
             // for server which uses private / public key
            // in my setup, already has working value /run/user/1000/keyring/ssh
        });
    });

    server.listen(8080);
});