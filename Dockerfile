FROM ubuntu:24.04

# Unminimize container
RUN yes | unminimize

# Update and install necessary packages
RUN apt update && apt upgrade -y
RUN apt install -y inotify-tools sudo less man-db openssh-server && apt clean

# Create user
RUN useradd -m -s /bin/bash -G sudo test && echo 'test:Test1234' | chpasswd

# Create files for tasks
RUN mkdir /home/test/.ajutine && echo "peidetud faili sisu Prakitkum1 veebruar 2022 \n...\n\nAdmin parool on Test1234" > /home/test/.ajutine/.h2sti_peidetud
RUN touch /home/.veel1Failon2ra_peidetud /home/.sedaEiPeaksKuvamaMeidetud

# Disable password auth and root login
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config \
    && sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config

# Create ssh directory for user
RUN mkdir -p /home/test/.ssh

# Restart ssh service
RUN service ssh restart
CMD ["/usr/sbin/sshd", "-D"]