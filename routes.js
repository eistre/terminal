//copied from https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
//Credit goes to Elliot404
//Modified to be a promise and reject if port is in use.
function createPage(host, port) {
  const express = require('express')
  const app = express()
  const http = require('http').Server(app);

  var cors = require('cors')
  app.use(cors());
  app.options('*', cors());

  return new Promise((resolve, reject) => {
    if (port === 80) {
      addStartingPageResources();
    } else {
      addTerminalPageResources();
    }

    http.listen(port, host,
      () => {
        console.log(`Page is ready on http://${host}:` + port);
        resolve(http);
      });
    http.on('error', (error) => {
      reject(error);
    });
  })

  function addStartingPageResources() {
    app.use(express.static(__dirname + '/webpages/start/'));
    app.get('/', (req, res) => {
      res.sendFile(__dirname + '/webpages/start/startingPage.html');
    });
  }

  function addTerminalPageResources() {
    app.use(express.static(__dirname + '/webpages/terminal/'));
    app.use('/xterm.css', express.static(require.resolve('./node_modules/xterm/css/xterm.css')));
    app.use('/xterm.js', express.static(require.resolve('./node_modules/xterm/lib/xterm.js')));
    app.use('/xterm-addon-webgl.js', express.static(require.resolve('./node_modules/xterm-addon-webgl/lib/xterm-addon-webgl.js')));

    app.get('/', (req, res) => {
      res.sendFile(__dirname + '/webpages/terminal/terminalPage.html');
    });
  }
}
exports.makeNewPage = createPage;