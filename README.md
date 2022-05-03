# UbuntuTerminal_WebPage

Bachelor's thesis project

On first button click a Ubuntu instance will be built and connected to from the web browser.
Most useful for learning the Ubuntu terminal commands.

To start the project run the following commands in this directory: 


    0. make sure that docker is up.

    1. change variables HOST in .env, ./webpages/start/startingPage.js and in ./webpages/terminal/terminalDisplay.js to your public IP address

    2. npm install
    
    3. node api.js

    4. Open browser in http://{your IP address} or localhost (the correct address will be written to console as well)