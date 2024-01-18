import db from '~/prisma/db'

export const createExercises = async () => {
  const { id: ee } = await db.exercise.create({
    data: {
      title: 'Operatsioonisüsteemid ja Andmeturve',
      description: 'Operatsioonisüsteemide ja Andmeturve ainete Linuxi käsurea harjutusülesanded'
    }
  })

  const { id: en } = await db.exercise.create({
    data: {
      title: 'Operating Systems and Computer Security',
      description: 'Linux command line tasks for the Operating Systems and Computer Security subjects'
    }
  })

  // Create ee tasks
  await db.task.createMany({
    data: [
      {
        title: 'Ülesanne 1 - Faili sisu lugemine',
        content: 'Kuva faili `/etc/hosts` faili sisu käsureale.',
        hint: 'Kasuta käsku `cat`',
        regex: /127\.0\.0\.1[\s\S]*localhost[\s\S]*ip6-localhost[\s\S]*localnet[\s\S]*allnodes[\s\S]*allrouters/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 2 - Kausta loomine',
        content: 'Loo `user` kasutaja kodukausta alamkaust, mille nimes esineb vähemalt üks inglise tähestiku väiketäht, number, tühik, võrdlusmärk ja lauselõpumärk.',
        hint: 'Kasutaja `user` kodukaust on `/home/user/`',
        regex: /\/home\/user\/ CREATE,ISDIR (?=.*[a-z])(?=.*\d)(?=.* )(?=.*[<>=])(?=.*[.!?])/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 3 - Faili nimede leidmine',
        content: 'Leia salajane fail koos absoluutse failiteega, mis asub `/` kaustas või selle alamkaustades ja mis lõppeb sõnega `hidden_secret`.',
        hint: 'Kasuta käsku `find` ja selle parameetreid, permission denied ridade mitte kuvamiseks lisa käsu lõppu `2>/dev/null`',
        regex: /\/var\/.secrets\/.super_hidden_secret/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 4 - Faili sisu leidmine',
        content: 'Leia `/var` kaustast või selle alamkaustadest fail, mis sisaldab teksti `Sudo password`. Jäta parool meelde, kuna seda läheb hiljem vaja!',
        hint: 'Uuri käsku `grep`, permission denied ridade mitte kuvamiseks lisa käsu lõppu `2>/dev/null`',
        regex: /Sudo\s+password\s+is\s+password123/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 5 - Tarkvara paigaldamine',
        content: 'Paigalda tarkvara nimega `nano` ja leia, kus asuvad selle binaarid.',
        hint: 'Kasuta käske `sudo apt` ja `whereis`',
        regex: /\/usr\/bin\/nano/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 6 - Failiõigused',
        content: 'Loo kasutaja `user` kodukausta fail nimega `test_file` ja faili sisuks pane oma nimi. Muuda faili õigusi nii, et faili omanik ja grupp saaks faili lugeda ja kirjutada, kuid mitte käivitada. Teistele kasutajatele keela failile ligipääs. Enese- ja automaatkontrolliks käivita käsk `ls -la /home/user/test_file`.',
        hint: 'Uuri Linuxi failiõiguste kohta',
        regex: /-rw-rw----.*user.*user.*test_file/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 7 - Failide töötlemine',
        content: 'Lae alla fail `https://raw.githubusercontent.com/eistre/terminal/master/public/tammsaare.txt` ja kuva ainult selles esinevate sõnade arv.',
        hint: 'Kasuta käske `wget` ja `wc`',
        regex: /412320/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 8 - Torud',
        content: 'Kuva ainult `df -h` käsu väljundi `Filesystem` veerg.',
        hint: 'Kasuta torusid (pipes) ja `cut` käsku',
        regex: /Filesystem\s+overlay\s+tmpfs[\s\S]+?\/dev\//.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 9 - Kustutamine',
        content: 'Kustuta kaust `/home/user/.temporary` ja selle sisu.',
        hint: 'Uuri käsku `rm` ja selle parameetreid',
        regex: /DELETE,ISDIR .temporary/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 10 - Protsessid',
        content: 'Kuva kõik käimasolevad protsessid.',
        hint: 'Uuri käsku `ps`',
        regex: /\d+.*\d+:\d+.*inotifywait/.source,
        exercise_id: ee
      }
    ]
  })

  // Create en tasks
  await db.task.createMany({
    data: [
      {
        title: 'Task 1 - Reading file content',
        content: 'Display the contents of `/etc/hosts` to the command line.',
        hint: 'Use the `cat` command.',
        regex: /127\.0\.0\.1[\s\S]*localhost[\s\S]*ip6-localhost[\s\S]*localnet[\s\S]*allnodes[\s\S]*allrouters/.source,
        exercise_id: en
      }, {
        title: 'Task 2 - Creating directories',
        content: 'Create a new directory inside the home directory of `user` account with a name that contains at least one lowercase letter of the English alphabet, a number, a space, a comparison symbol and an end-of-sentence symbol.',
        hint: 'The home directory of `user` is `/home/user/`',
        regex: /\/home\/user\/ CREATE,ISDIR (?=.*[a-z])(?=.*\d)(?=.* )(?=.*[<>=])(?=.*[.!?])/.source,
        exercise_id: en
      }, {
        title: 'Task 3 - Finding file names',
        content: 'Find a secret file with its absolute file path, that is located in the `/` directory or one of its subdirectories and ends with `hidden_secret`.',
        hint: 'Use the `find` command and its parameters, to avoid the permission denied messages, add `2>/dev/null` to the end of the command',
        regex: /\/var\/.secrets\/.super_hidden_secret/.source,
        exercise_id: en
      }, {
        title: 'Task 4 - Finding file content',
        content: 'Find a file containing the text `Sudo password` inside `/var` directory or one of its subdirectories. Remember the password, you will need it later!',
        hint: 'Learn about `grep`, to avoid the permission denied messages, add `2>/dev/null` to the end of the command',
        regex: /Sudo\s+password\s+is\s+password123/.source,
        exercise_id: en
      }, {
        title: 'Task 5 - Installing software',
        content: 'Install the package called `nano` and find out where its binaries are located.',
        hint: 'Use the `sudo apt` and `whereis` commands',
        regex: /\/usr\/bin\/nano/.source,
        exercise_id: en
      }, {
        title: 'Task 6 - File permissions',
        content: 'Create a file called `test_file` inside the `user` account home directory and put your name inside it. Change the file permissions so that the owner and group of the file can read and write, but not execute it. Deny other users access. Run `ls -la /home/user/test_file` for self- and automatic testing.',
        hint: 'Learn about Linux file permissions',
        regex: /-rw-rw----.*user.*user.*test_file/.source,
        exercise_id: en
      }, {
        title: 'Task 7 - Working with files',
        content: 'Download the file `https://raw.githubusercontent.com/eistre/terminal/master/public/tammsaare.txt` and only show the number of words in it.',
        hint: 'Use the `wget` and `wc` commands',
        regex: /412320/.source,
        exercise_id: en
      }, {
        title: 'Task 8 - Pipes',
        content: 'Only show the `Filesystem` column of the `df -h` command.',
        hint: 'Use pipes and the `cut` command',
        regex: /Filesystem\s+overlay\s+tmpfs[\s\S]+?\/dev\//.source,
        exercise_id: en
      }, {
        title: 'Task 9 - Deletion',
        content: 'Delete the `/home/user/.temporary` directory and its content.',
        hint: 'Learn about the `rm` command and its parameters',
        regex: /DELETE,ISDIR .temporary/.source,
        exercise_id: en
      }, {
        title: 'Task 10 - Processes',
        content: 'Display all running processes.',
        hint: 'Learn about the `ps` command',
        regex: /\d+.*\d+:\d+.*inotifywait/.source,
        exercise_id: en
      }
    ]
  })
}

export const createDomains = async () => {
  await db.domain.createMany({
    data: [{
      name: 'ut.ee',
      hidden: false
    }, {
      name: 'tlu.ee',
      hidden: false
    }, {
      name: 'taltech.ee',
      hidden: false
    }]
  })
}
