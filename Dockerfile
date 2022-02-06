#Takes given arguments into use.
ARG usr
ARG pwd

#TODO: Teeb koopia juba avatud pordiga ubuntust.
FROM ubuntu:20.04

RUN apt update && apt install  openssh-server sudo -y

RUN apt update && apt install inotify-tools sudo -y

RUN useradd -rm -s /bin/bash -g root -G sudo -u 1000 test 

RUN  echo 'test:Test1234' | chpasswd

RUN mkdir /home/test/.ajutine && echo "peidetud faili sisu Prakitkum1 veebruar 2022 \n...\n\nAdmin parool on Test1234" > /home/test/.ajutine/.h2sti_peidetud; touch /home/.veel1Failon2ra_peidetud /home/.sedaEiPeaksKuvamaMeidetud

RUN service ssh start
#Opens port nr 22 which is used for SSH connections.
EXPOSE 22

CMD ["/usr/sbin/sshd","-D"]