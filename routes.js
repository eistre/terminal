require('dotenv').config();
const express = require('express')
const app = express()
const http = require('http').Server(app);

var cors = require('cors')
app.use(cors());
app.options('*', cors());

app.use(express.static(__dirname + '/front-end/dist'));


http.listen(80, process.env.HOST,
    () => {console.log(`Page is ready on http://${process.env.HOST}:` + 80);});
http.on('error', (error) => {
    throw error;
});


