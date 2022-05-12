# UbuntuTerminal_WebPage

Bachelor's thesis project

On first button click a Ubuntu instance will be built and connected to from the web browser.
Most useful for learning the Ubuntu terminal commands.

To start the project run the following commands in this directory: 


    1. npm install
    

    2. echo "HOST='<your external IP>'" >> .env


    3. cd front-end


    4. npm install


    5. echo "VITE_HOST=<your external IP>" >> .env

    
    6. npm run build


    7. cd ..


    8. make sure that docker is running.


    9. node api.js


Steps 1-7 only need to be done the first time. Steps 8 and 9 need to be done every time to run the server.