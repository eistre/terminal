const http = require('http')
const fs = require('fs')
const { Client } = require('ssh2');
const prompt = require('prompt-sync')();

const port = 3000

const server = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    fs.readFile('index.html', function (error, data) {
        if (error) {
            res.writeHead(404)
            res.write('Error: File Not Found')
        } else {
            res.write(data)
        }
        res.end()
    })
})

server.listen(port, function (error) {
    if (error) {
        console.log('Something went wrong', error)
    } else {
        console.log('Server up and running!')
    }
})

// Jooksutamine: node app.js
//Loob ühenduse ja see töötab, kuid käsu väljundit näeb pärast lõpetamist.
const conn = new Client();
let UserExit = false;
conn.on('ready', () => {
    console.log('Client :: ready');
    conn.shell((err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('Stream :: close');
            conn.end();
        }).on('data', (data) => {
            console.log('OUTPUT: ' + data);
        });
        while (!UserExit) {     //
            const name = prompt();
            stream.write(name + '\n');
            if (name == 'exit') {
                UserExit = true
                stream.end('exit\n');
            }
        }
    });
}).connect({
    host: 'localhost',
    port: 22,
    username: 'test',
    password: 'test',
    //privateKey: fs('/path/to/my/key')
});