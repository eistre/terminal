#!/bin/bash

read -r -p 'Enter password for database: ' dbpass
read -r -p 'Enter password for admin account: ' adminpass
read -r -p 'Launch app at startup [Y/n]: ' startup

# Update
sudo apt update && sudo apt upgrade -y

# Install Microk8s
sudo snap install microk8s --classic

# Wait until cluster ready
sudo microk8s status --wait-ready
kube_config=$(sudo base64 -w 0 /var/snap/microk8s/current/credentials/client.config)

# Install git, nginx and node
sudo apt install -y git nginx
curl -fsSL https://deb.nodesource.com/setup_21.x | sudo -E bash - && sudo apt install -y nodejs

# Add proxy for port 80
sudo rm /etc/nginx/sites-enabled/default
sudo sh -c 'cat > /etc/nginx/sites-available/nuxt <<- END
map \$http_upgrade \$connection_upgrade {
  default upgrade;
  ""  close;
}

server {
  listen 80;

  location / {
    proxy_pass  "http://127.0.0.1:3000";
	  proxy_set_header  Upgrade \$http_upgrade;
	  proxy_set_header  Connection  \$connection_upgrade;
    proxy_set_header  Host  \$host;
    proxy_set_header  X-Forwarded-For \$remote_addr;
  }
}
END'

# Restart proxy
sudo ln -s /etc/nginx/sites-available/nuxt /etc/nginx/sites-enabled/nuxt
sudo service nginx restart

# Update
sudo apt update && sudo apt upgrade -y && sudo apt clean

# Clone repository
cd "$HOME" || exit
git clone https://github.com/eistre/terminal.git
cd terminal || exit

# Launch database
sudo microk8s kubectl create namespace mysql
sudo microk8s kubectl create secret generic dbpass --from-literal=dbpass="$dbpass" -n mysql
sudo microk8s kubectl apply -f ./local/mysql.yaml

# NPM install and build
npm install
npx prisma generate
npm run build

# Create environment
cat > .env <<- END
DATABASE_URL='mysql://root:$dbpass@localhost:30000/terminal'
ADMIN_PASSWORD='$adminpass'
LOG_PRETTY=TRUE
KUBE_CONFIG='$kube_config'
JWT_SECRET='$(openssl rand -base64 24)'
POD_DATE_VALUE=2
POD_DATE_UNIT=hours
USER_DATE_VALUE=2
USER_DATE_UNIT=months
POD_CRON_TIMER='0 0/15 * * * *'
USER_CRON_TIMER='0 0/15 * * * *'
END

# Sync database
npx prisma db push

# If no run at startup
if ! [[ -z ${startup,,} || ${startup,,} == 'y' || ${startup,,} == 'yes' ]]; then
    # Allow user to communicate with Microk8s
    sudo usermod -a -G microk8s "$USER"
    sudo chown -f -R "$USER" ~/.kube
    newgrp microk8s
    exit
fi

# Create startup script
cat > ./local/startup.sh <<- END
#!/bin/bash

echo Waiting 120 seconds for database to start

sleep 120s

ip_address=\$(ip a | grep inet.*enp | awk '/inet / {print \$2}' | cut -d '/' -f 1)
echo Running app on \$ip_address

cd $HOME/terminal
npm run preview
END

chmod u+x ./local/startup.sh
mkdir -p "$HOME"/.config/autostart

cat > "$HOME"/.config/autostart/terminal_app.desktop <<- END
[Desktop Entry]
Type=Application
Name=Linux Terminal Exercise Application
Description=Web Application for Linux Terminal Exercises
Exec=bash $HOME/terminal/local/startup.sh
Terminal=true
END

# Allow user to communicate with Microk8s
sudo usermod -a -G microk8s "$USER"
sudo chown -f -R "$USER" ~/.kube
newgrp microk8s
