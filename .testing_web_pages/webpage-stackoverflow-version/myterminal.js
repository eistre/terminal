import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

import './xterm.css'; // copy of node_modules/xterm/css/xterm.css
// xterm css is not imported:
// https://github.com/xtermjs/xterm.js/issues/1418
// This is a problem in Meteor because Webpack won't import files from node_modules: https://github.com/meteor/meteor-feature-requests/issues/278

const io = require('socket.io-client');

function termFunction() {
    // Socket io client
    const PORT = 8080;

    const terminalContainer = document.getElementById('terminal-container');
    const term = new Terminal({ 'cursorBlink': true });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainer);
    fitAddon.fit();

    const socket = io(`http://localhost:22`);
    socket.on('connect', () => {
        console.log('socket connected');
        term.write('\r\n*** Connected to backend***\r\n');

        // Browser -> Backend
        term.onData((data) => {
            socket.emit('data', data);
        });

        // Backend -> Browser
        socket.on('data', (data) => {
            term.write(data);
        });

        socket.on('disconnect', () => {
            term.write('\r\n*** Disconnected from backend***\r\n');
        });
    });
}