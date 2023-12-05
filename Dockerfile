FROM ubuntu:24.04

RUN yes | unminimize

RUN apt update && apt upgrade -y

RUN apt install inotify-tools sudo less man-db openssh-server -y && apt clean

RUN useradd -rm -s /bin/bash -g root -G sudo test

RUN echo 'test:Test1234' | chpasswd

RUN mkdir /home/test/.ajutine && echo "peidetud faili sisu Prakitkum1 veebruar 2022 \n...\n\nAdmin parool on Test1234" > /home/test/.ajutine/.h2sti_peidetud

RUN touch /home/.veel1Failon2ra_peidetud /home/.sedaEiPeaksKuvamaMeidetud

EXPOSE 22

CMD ["/usr/sbin/sshd", "-D"]