const express = require('express')
const app = express()
const PORT = 8080;
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

        const child_process = require('child_process');           // host                   user    password -> should come from env file for now
        var worker_process = child_process.fork("webpage/app.js", ['127.0.0.1', portNumber, 'test', 'test', portNumber + 1]);
        worker_process.on('close', function (code) {
          console.log('child process exited with code ' + code);
        });
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

/**
/// bad practice i think
// -------------------- CENTRAL BUTTON PAGE -------------------

//copy-pasted from: https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
//Credit goes to Elliot404
const http = require('http').Server(app);
app.set('view engine', 'ejs');
app.use(express.urlencoded({
  extended: false,
  limit: '150mb'
}));
//app.use(express.static(__dirname + '/public'));
app.use('/style.css', express.static(require.resolve('./style.css')));
//app.use('/xterm.js', express.static(require.resolve('xterm')));
//app.use('/xterm-addon-fit.js', express.static(require.resolve('xterm-addon-fit')));


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/startingPage.html');
  //res.render('index');
  // I am using ejs as my templating engine but HTML file work just fine.
});

http.listen(8000, () => {
  console.log('Listening on http://localhost:' + 8000);
}); 

 */