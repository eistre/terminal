//copy-pasted from: https://stackoverflow.com/questions/38689707/connecting-to-remote-ssh-server-via-node-js-html5-console
//Credit goes to Elliot404
const express = require('express')
const app = express()
const http = require('http').Server(app);
app.set('view engine', 'ejs');
app.use(express.urlencoded({
  extended: false,
  limit: '150mb'
}));

app.use('/startingPage.css', express.static(require.resolve('./startingPage.css')));
app.use('/startingPage.js', express.static(require.resolve('./startingPage.js')));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/startingPage.html');
});

http.listen(8000, () => {
  console.log('Listening on http://localhost:' + 8000);
}); 

const runeverythingelseFornow = require("./api.js")