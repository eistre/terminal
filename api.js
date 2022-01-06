const express = require('express')
const app = express()
const PORT = 8080;
const master = require('./master')

app.use(express.json())


app.post('/ubuntuInstance/:id', (req, res) => {

  const { id } = req.params;
  //const { used_for_later } = req.body;
  const port = 49152 + Number(id)
  //TODO: kontrollida et tüüp oleks õige ja viga visata muidu.'
  master.newContainer(port, (result) => {

    console.log(`Return code ${result}`)

    //Kui olemas siis 200 == OK.
    //Kui pole olemas, siis 201 == created.
    res.status(result).send({
      yourAdress: `http://localhost:${port + 1}`,
    })
    
  });
})

app.listen(
  PORT,
  () => console.log(`it's alive on http://localhost:${PORT}`)
)


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
  res.sendFile(__dirname + '/Button.html');
  //res.render('index');
  // I am using ejs as my templating engine but HTML file work just fine.
});

http.listen(8000, () => {
  console.log('Listening on http://localhost:' + 8000);
});