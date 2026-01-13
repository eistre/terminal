FROM ubuntu:24.04

# Unminimize container
RUN yes | unminimize

# Update and install necessary packages
RUN apt update && apt upgrade -y
RUN apt install -y inotify-tools sudo less man-db openssh-server && apt clean

# Disable password auth and root login
RUN sed -i "s/#PasswordAuthentication yes/PasswordAuthentication no/" /etc/ssh/sshd_config \
    && sed -i "s/#PermitRootLogin prohibit-password/PermitRootLogin no/" /etc/ssh/sshd_config

# Create user
RUN useradd -m -s /bin/bash user && echo "user:password123" | chpasswd

# Create files for tasks
USER user
RUN touch /home/user/simple_file && echo "This is a Simple file" > /home/user/simple_file
RUN mkdir /home/user/.temporary && echo "Temporary file" > /home/user/.temporary/temporary_file

USER root
RUN mkdir /var/.secrets && echo "Hidden secret" > /var/.secrets/.super_hidden_secret
RUN mkdir /var/.hidden && echo "Password file content\n...\n\nSudo password is password123\n" > /var/.hidden/.hidden_password

# Only allow sudo apt install
RUN echo 'user ALL=(ALL) /usr/bin/apt install nano' > /etc/sudoers.d/apt-install && chmod 440 /etc/sudoers.d/apt-install
RUN echo 'user ALL=(ALL) /usr/bin/apt-get install nano' > /etc/sudoers.d/apt-get-install && chmod 440 /etc/sudoers.d/apt-get-install

# Copy entrypoint script to set up authorized_keys from SSH_PUBLIC_KEY
COPY packages/provisioner/image/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 22
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
