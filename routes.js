require('dotenv').config()
//copy-pasted from: https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
//Credit goes to Elliot404
const express = require('express')
const app = express()
var cors = require('cors')
app.use(cors());
app.options('*', cors());
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
/**app.get('/auth', (req, res) => { possible authentication way.
  res.redirect(`https://login.microsoftonline.com/ut.ee/oauth2/v2.0/authorize?
  client_id=2a885cab-d3fe-4e5c-8a81-cd1b294fc63f
  &response_type=code
  &redirect_uri=http://localhost:49153&response_mode=query
  &scope=openid%20offline_access%20https%3A%2F%2Fgraph.microsoft.com%2Fmail.read
  &state=stringofchosencontent`);
});*/
//https://login.microsoftonline.com/6d356317-0d04-4abc-b6b6-8c9773885bb0/oauth2/authorize?response_type=code&client_id=2a885cab-d3fe-4e5c-8a81-cd1b294fc63f
//&scope=openid%20profile%20email
//&nonce=N61e1a04f2718e&response_mode=form_post
//&resource=https%3A%2F%2Fgraph.microsoft.com&state=TX1LwXG7dlAOs5O&redirect_uri=https%3A%2F%2Fmoodle.ut.ee%2Fauth%2Foidc%2F

http.listen(80,
  //process.env.HOST,
  () => {
    console.log(`StartingPage is ready on http://${process.env.HOST}:` + 80);
  });

//copied from https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
//Credit goes to Elliot404
//Modified to be a promise and reject if port is in use.
function createPage(port) {
  return new Promise((resolve, reject) => {
    const express = require('express')
    const app = express()
    const http = require('http').Server(app);
    var cors = require('cors')
    app.use(cors());
    app.options('*', cors());

    console.log(port)
    app.set('view engine', 'ejs');
    app.use(express.urlencoded({
      extended: false,
      limit: '150mb'
    }));
    app.use(express.static(__dirname + '/webpages/terminal/'));
    app.use('/xterm.css', express.static(require.resolve('./node_modules/xterm/css/xterm.css')));
    app.use('/xterm.js', express.static(require.resolve('./node_modules/xterm/lib/xterm.js')));
    //app.use('/xterm-addon-fit.js', express.static(require.resolve('./node_modules/xterm-addon-fit/lib/xterm-addon-fit.js')));
    app.use('/xterm-addon-webgl.js', express.static(require.resolve('./node_modules/xterm-addon-webgl/lib/xterm-addon-webgl.js')));

    app.get('/', (req, res) => {
      res.sendFile(__dirname + '/webpages/terminal/terminalPage.html');
    });


    http.listen(port,
      process.env.HOST,
      () => {
        console.log(`Listening on http://${process.env.HOST}:` + port);
        resolve(http);
      });

    http.on('error', (error) => {
      reject(error)
    })

  })
}
exports.makeNewPage = createPage;