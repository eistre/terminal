#Takes given arguments into use.
ARG usr
ARG pwd

#TODO: Teeb koopia juba avatud pordiga ubuntust.
FROM ubuntu:20.04

RUN apt update && apt install  openssh-server sudo -y

RUN apt update && apt install inotify-tools sudo -y

RUN useradd -rm -s /bin/bash -g root -G sudo -u 1000 test 

RUN  echo 'test:test' | chpasswd

RUN echo "peidetud faili sisu Prakitkum1 veebruar 2022 \n...\n\nAdmin parool on test" >> /home/test/.h2sti_peidetud

RUN service ssh start
#Opens port nr 22 which is used for SSH connections.
EXPOSE 22

CMD ["/usr/sbin/sshd","-D"]