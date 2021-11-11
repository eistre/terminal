import paramiko

hostname = 'localhost'
port = 22
user = 'test'
passwd = 'test'

#Veel hullem versioon kui Node JS'iga kuna iga uus käsk tehakse algkaustast...
try:
    client = paramiko.SSHClient()
    client.load_system_host_keys()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, port=port, username=user, password=passwd)
    while True:
        try:
            cmd = input('$> ')
            if cmd == "exit" : break
            stdin, stdout, stderr = client.exec_command(cmd)
            print(stdout.read().decode())
        except KeyboardInterrupt:
            break
    client.close()
except Exception as err:
    print(str(err))
