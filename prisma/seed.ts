import db from '~/prisma/db'

export const seed = async () => {
  // @ts-ignore
  const { id: ee } = await db.exercise.create({
    data: {
      title: 'Operatsioonisüsteemid ja Andmeturve',
      description: 'Operatsioonisüsteemide ja Andmeturve ainete Linuxi käsurea harjutusülesanded'
    }
  })

  // @ts-ignore
  const { id: en } = await db.exercise.create({
    data: {
      title: 'Operating Systems ja Computer Security',
      description: 'Linux command line tasks for the Operating Systems and Computer Security subjects'
    }
  })

  // Create ee tasks
  // @ts-ignore
  await db.task.createMany({
    data: [
      {
        title: 'Ülesanne 1',
        content: 'Kuva faili `/etc/hosts` faili sisu käsureale.',
        hint: 'Kasuta käsku `cat`',
        regex: /127\.0\.0\.1[\s\S]*localhost[\s\S]*ip6-localhost[\s\S]*localnet[\s\S]*allnodes[\s\S]*allrouters/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 2',
        content: 'Loo `user` kasutaja kodukausta alamkaust, mille nimes esineb vähemalt üks inglise tähestiku väiketäht, number, tühik, võrdlusmärk ja lauselõpumärk.',
        hint: null,
        regex: /\/home\/user\/ CREATE,ISDIR (?=.*[a-z])(?=.*\d)(?=.* )(?=.*[<>=])(?=.*[.!?])/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 3',
        content: 'Leia salajane fail koos absoluutse failiteega, mis asub `/` kaustas või selle alamkaustades ja mis lõppeb sõnega `hidden_secret`.',
        hint: 'Kasuta käsku `find`, permission denied ridade mitte kuvamiseks lisa käsu lõppu `2>/dev/null`',
        regex: /\/var\/.secrets\/.super_hidden_secret/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 4',
        content: 'Leia `/var` kaustast või selle alamkaustadest fail, mis sisaldab teksti `Sudo password`. Jäta parool meelde, kuna seda läheb hiljem vaja!',
        hint: 'Permission denied ridade mitte kuvamiseks lisa käsu lõppu `2>/dev/null`',
        regex: /Sudo[\s\S]+password[\s\S]+is[\s\S]+password123/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 5',
        content: 'Paigalda tarkvara nimega `nano` ja leia, kus asuvad selle binaarid.',
        hint: 'Kasuta käske `sudo apt` ja `whereis`',
        regex: /\/usr\/bin\/nano/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 6',
        content: 'Loo kasutaja `user` kodukausta fail nimega `test_file` ja faili sisuks pane oma nimi. Muuda faili õigusi nii, et faili omanik ja grupp saaks faili lugeda ja kirjutada, kuid mitte käivitada. Teistele kasutajatele keela failile ligipääs. Enese- ja automaatkontrolliks käivita käsk `ls -la /home/user/test_file`.',
        hint: null,
        regex: /-rw-rw----.*user.*user.*test_file/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 7',
        content: 'Lae alla fail `https://raw.githubusercontent.com/eistre/terminal/master/public/tammsaare.txt` ja leia selles esinevate sõnade arv.',
        hint: 'Kasuta käske `wget` ja `wc`',
        regex: /^412320/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 8',
        content: 'Loe `tammsaare.txt` faili sisu, sorteeri see, võta viimased 15 rida ning leia väljundis esinevate sõnade arv.',
        hint: 'Kasuta torusid (pipes)',
        regex: /^494/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 9',
        content: 'Kustuta kaust `/home/user/.temporary` ja selle sisu.',
        hint: null,
        regex: /DELETE,ISDIR .temporary/.source,
        exercise_id: ee
      }, {
        title: 'Ülesanne 10',
        content: 'Kuva kõik käimasolevad protsessid.',
        hint: 'Uuri käsku `ps`',
        regex: /\d+.*\d+:\d+.*inotifywait/.source,
        exercise_id: ee
      }
    ]
  })

  // Create en tasks
  // @ts-ignore
  await db.task.createMany({
    data: [
      {
        title: 'Task 1',
        content: 'Display the contents of `/etc/hosts` to the command line.',
        hint: 'Use the `cat` command.',
        regex: /127\.0\.0\.1[\s\S]*localhost[\s\S]*ip6-localhost[\s\S]*localnet[\s\S]*allnodes[\s\S]*allrouters/.source,
        exercise_id: en
      }, {
        title: 'Task 2',
        content: 'Create a new directory inside the home directory of `user` account with a name that contains at least one lowercase letter of the English alphabet, a number, a space, a comparison symbol and an end-of-sentence symbol.',
        hint: null,
        regex: /\/home\/user\/ CREATE,ISDIR (?=.*[a-z])(?=.*\d)(?=.* )(?=.*[<>=])(?=.*[.!?])/.source,
        exercise_id: en
      }, {
        title: 'Task 3',
        content: 'Find a secret file with its absolute file path, that is located in the `/` directory or one of its subdirectories and ends with `hidden_secret`.',
        hint: 'Use the `find` command, to avoid the permission denied messages, add `2>/dev/null` to the end of the command',
        regex: /\/var\/.secrets\/.super_hidden_secret/.source,
        exercise_id: en
      }, {
        title: 'Task 4',
        content: 'Find a file containing the text `Sudo password` inside `/var` directory or one of its subdirectories. Remember the password, you will need it later!',
        hint: 'To avoid the permission denied messages, add `2>/dev/null` to the end of the command',
        regex: /Sudo[\s\S]+password[\s\S]+is[\s\S]+password123/.source,
        exercise_id: en
      }, {
        title: 'Task 5',
        content: 'Install the package called `nano` and find out where its binaries are located.',
        hint: 'Use the `sudo apt` and `whereis` commands',
        regex: /\/usr\/bin\/nano/.source,
        exercise_id: en
      }, {
        title: 'Task 6',
        content: 'Create a file called `test_file` inside the `user` account home directory and put your name inside it. Change the file permissions so that the owner and group of the file can read and write, but not execute it. Deny other users access. Run `ls -la /home/user/test_file` for self- and automatic testing.',
        hint: null,
        regex: /-rw-rw----.*user.*user.*test_file/.source,
        exercise_id: en
      }, {
        title: 'Task 7',
        content: 'Download the file `https://raw.githubusercontent.com/eistre/terminal/master/public/tammsaare.txt` and find the number of words in it.',
        hint: 'Use the `wget` and `wc` commands',
        regex: /^412320/.source,
        exercise_id: en
      }, {
        title: 'Task 8',
        content: 'Read the contents of the `tammsaare.txt` file, sort it, take the last 15 lines and find the number of words in the output.',
        hint: 'Use pipes',
        regex: /^494/.source,
        exercise_id: en
      }, {
        title: 'Task 9',
        content: 'Delete the `/home/user/.temporary` directory and its content.',
        hint: null,
        regex: /DELETE,ISDIR .temporary/.source,
        exercise_id: en
      }, {
        title: 'Task 10',
        content: 'Display all running processes.',
        hint: 'Learn about the `ps` command',
        regex: /\d+.*\d+:\d+.*inotifywait/.source,
        exercise_id: en
      }
    ]
  })
}
