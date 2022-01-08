const express = require('express')
const app = express()
const PORT = 8080;
const routes = require('./routes')
const dockerController = require('./dockerController')

app.use(express.json())

var StartingPort = 49152


app.post('/ubuntuInstance/:id', (req, res) => {
  /**
   * Call to action response comes.
   * The action that we take: 
   * 1) docker (activete, check if exists, make it exist.)
   * 2) make website and connect it to docker
   * 3) send back signal that all is fine and proceed.
   * 
  */
  const { id } = req.params;
  if (id === 'Unknown') {
    portNumber = StartingPort;
    StartingPort += 2;
    //TODO: kontrollida et tüüp oleks õige ja viga visata muidu.'
    //TODO: kusagil kunagi - avab samas aknas.
    dockerController.newContainer(portNumber, (result) => {

      console.log(`Return code ${result}`)

      if (result == 201) {
        //Webpage side
        //Creating the webpage and SSH into the OS via app.js in webpage.

        routes.newPage(portNumber+1, (http) => {//TODO: get the user/password from user.
          SSHConnect('127.0.0.1', portNumber, 'test', 'test', http)
        })
        res.status(result).send({
          yourAddress: `http://localhost:${portNumber + 1}`,
        })
      }
      else {
        console.log('The port we wanted to assign you was already taken.')
      }
    });
  }
  else {
    //const { used_for_later } = req.body;
    portNumber = Number(id) - 1 //-1 because the port number we gave is already 1 unit greater than the ubuntu port
    //just open it
    //TODO: Check if container has stopped, start it up again.
    res.status(200).send({
      yourAddress: `http://localhost:${portNumber + 1}`,
    })
  }

})

app.listen(
  PORT,
  () => console.log(`it's alive on http://localhost:${PORT}`)
)


//Still bad practice. is here now for convenience. TODO: cleanup later.
//copy-pasted from: https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
//Credit goes to Elliot404
//SSH connection.
function SSHConnect(host, port, username, password, http) {
  const SSHClient = require('ssh2').Client;
  const io = require('socket.io')(http, {
    cors: {
      origin: "*"
    }
  });

  io.on('connection', function (socket) {
    var conn = new SSHClient();
    conn.on('ready', function () {
      socket.emit('data', '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
      conn.shell(function (err, stream) {
        if (err)
          return socket.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
        socket.on('data', function (data) {
          stream.write(data);
        });
        stream.on('data', function (d) {
          socket.emit('data', d.toString('binary'));
        }).on('close', function () {
          conn.end();
        });
      });
    }).on('close', function () {
      socket.emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');
    }).on('error', function (err) {
      socket.emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
    }).connect({
      host: host,
      port: port,
      username: username,
      password: password,
    });
  });
}