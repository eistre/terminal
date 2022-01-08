#Takes given arguments into use.
ARG usr
ARG pwd

#TODO: Teeb koopia juba avatud pordiga ubuntust.
FROM ubuntu:20.04

RUN apt update && apt install  openssh-server sudo -y

RUN useradd -rm -s /bin/bash -g root -G sudo -u 1000 test 

RUN  echo '$usr:$pwd' | chpasswd

RUN service ssh start
#Opens port nr 22 which is used for SSH connections.
EXPOSE 22

CMD ["/usr/sbin/sshd","-D"]