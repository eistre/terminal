window.addEventListener('load', function () {
    const terminalContainer = document.getElementById('terminal-container');
    const term = new Terminal({
      cursorBlink: true
    });
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainer);
    fitAddon.fit();

    const socket = io() //.connect();
    socket.on('connect', function () {
      term.write('\r\n*** Connected to backend ***\r\n');
    });

    // Browser -> Backend
    term.onKey(function (ev) {
      socket.emit('data', ev.key);
    });

    // Backend -> Browser
    socket.on('data', function (data) {
      term.write(data);
    });

    socket.on('disconnect', function () {
      term.write('\r\n*** Disconnected from backend ***\r\n');
    });
  }, false);