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

# On a fresh Ubuntu or WSL
1. Update software with `sudo apt update`.
2. Download git `sudo apt install git`
3. Download node version 16:
    ```
    curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/nodesource_setup.sh
    sudo bash /tmp/nodesource_setup.sh
    sudo apt install nodejs
    ```
4. Clone repo `git clone https://gitlab.com/JoonasHalapuu/ubuntuterminal.git`.

7. Install docker https://docs.docker.com/engine/install/ubuntu/#installation-methods or on WSL https://docs.docker.com/desktop/windows/wsl/
8. Configure sudoless docker https://docs.docker.com/engine/install/linux-postinstall/ or on Windows `net localgroup docker-users "your-user-id" /ADD`

10. Set te inotify instance values a lot higher:
    ```
    sudo sysctl -n -w fs.inotify.max_user_instances=540
    sudo sysctl -n -w fs.inotify.max_user_watches=15600384
    ```

11. Allow Node to listen on port 80:
    ```
    sudo apt-get install libcap2-bin
    sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``
    ```    
12. Reconfigure Docker IP to not interfere with University of Tartu network:
    
    Edit `/lib/systemd/system/docker.service` before start Docker. Add `--bip "172.80.0.0/16"` at the end of line `ExecStart=/usr/bin/dockerd`
    Then run:
    ```
    sudo systemctl daemon-reload
    sudo systemctl start docker
    ```
    or on WSL `sudo service docker restart`
13. Run the command 1-9 starting with npm install.
