//copy-pasted from: https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
//Credit goes to Elliot404
const express = require('express')
const app = express()
const http = require('http').Server(app);

//Add route to startingPage.
app.set('view engine', 'ejs');
app.use(express.urlencoded({
  extended: false,
  limit: '150mb'
}));

app.use(express.static(__dirname + '/webpages/start/'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/webpages/start/startingPage.html');
});

http.listen(8000, () => {
  console.log('Listening on http://localhost:' + 8000);
});

//copied from https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
//Credit goes to Elliot404
function createPage(port, res) {
  const express = require('express')
  const app = express()
  const http = require('http').Server(app);

  console.log(port)
  app.set('view engine', 'ejs');
  app.use(express.urlencoded({
    extended: false,
    limit: '150mb'
  }));
  app.use(express.static(__dirname + '/webpages/terminal/'));
  app.use('/xterm.css', express.static(require.resolve('xterm/css/xterm.css')));
  app.use('/xterm.js', express.static(require.resolve('xterm')));
  app.use('/xterm-addon-fit.js', express.static(require.resolve('xterm-addon-fit')));


  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/webpages/terminal/terminalPage.html');
    //res.render('terminalPage');
    // I am using ejs as my templating engine but HTML file work just fine.
  });

  http.listen(port, () => {
    console.log('Listening on http://localhost:' + port);
    res(http);
  });

}
exports.newPage = createPage;