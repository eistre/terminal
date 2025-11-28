FROM ubuntu:24.04

# Unminimize container
RUN yes | unminimize

# Update and install necessary packages
RUN apt update && apt upgrade -y
RUN apt install -y openssh-server && apt clean

# Disable password auth and root login
RUN sed -i "s/#PasswordAuthentication yes/PasswordAuthentication no/" /etc/ssh/sshd_config \
    && sed -i "s/#PermitRootLogin prohibit-password/PermitRootLogin no/" /etc/ssh/sshd_config

# Create user
RUN useradd -m -s /bin/bash user && echo "user:password123" | chpasswd

# Copy entrypoint script to set up authorized_keys from SSH_PUBLIC_KEY
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 22
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
