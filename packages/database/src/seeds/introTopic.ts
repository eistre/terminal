import type { TopicSeed } from '../types';

export const introTopic: TopicSeed = {
  topic: { slug: 'introduction-to-linux' },
  translations: [
    {
      locale: 'en',
      title: 'Introduction to Linux',
      description: 'Introductory tasks for the Linux command line',
    },
    {
      locale: 'et',
      title: 'Sissejuhatus Linuxisse',
      description: 'Sissejuhatavad ülesanded Linuxi käsureasse',
    },
  ],
  tasks: [
    {
      task: { regex: /ls[\s\S]+?simple_file\s/.source },
      translations: [
        {
          locale: 'en',
          title: 'Task 1 - File system',
          content: 'Display the contents of your current directory.',
          hint: 'To display the contents of a directory, you can use the `ls` command',
        },
        {
          title: 'Ülesanne 1 - Failisüsteem',
          content: 'Kuva oma praeguse kausta sisu.',
          hint: 'Kausta sisu kuvamiseks saab kasutada käsku `ls`',
          locale: 'et',
        },
      ],
    },
    {
      task: { regex: /drwxr-xr-x.*user.*user.*\.temporary/.source },
      translations: [
        {
          title: 'Task 2 - Hidden files',
          content: 'Display the contents of your current directory, including hidden elements.',
          hint: 'You can use the same command as in the previous task, but add the `-la` parameters',
          locale: 'en',
        },
        {
          title: 'Ülesanne 2 - Varjatud failid',
          content: 'Kuva oma praeguse kausta sisu, sealhulgas ka varjatud elemente.',
          hint: 'Varjatud elementide kuvamiseks saab kasutada sama käsku nagu eelmises ülesandes, kuid lisa parameetrid `-la`',
          locale: 'et',
        },
      ],
    },
    {
      task: { regex: /This is a Simple file\s/.source },
      translations: [
        {
          title: 'Task 3 - File content',
          content: 'Display the contents of the file `simple_file`.',
          hint: 'To display the contents of a file, you can use the `cat <file_name>` command',
          locale: 'en',
        },
        {
          title: 'Ülesanne 3 - Faili sisu',
          content: 'Kuva faili `simple_file` sisu.',
          hint: 'Faili sisu kuvamiseks saab kasutada käsku `cat <faili_nimi>`',
          locale: 'et',
        },
      ],
    },
    {
      task: { regex: /\/home\/user\s/.source },
      translations: [
        {
          title: 'Task 4 - File path',
          content: 'Display the location of your current directory.',
          hint: 'You can display the file path using the `pwd` command',
          locale: 'en',
        },
        {
          title: 'Ülesanne 4 - Failitee',
          content: 'Kuva oma praeguse kausta asukoht.',
          hint: 'Failiteed saab kuvada käsu `pwd` abil',
          locale: 'et',
        },
      ],
    },
    {
      task: { regex: /\/home\/user\/\|CREATE,ISDIR\|my_folder/.source, watchPath: '/home/user' },
      translations: [
        {
          title: 'Task 5 - Creating directories',
          content: 'Create a directory named `my_folder`.',
          hint: 'To create a directory, you can use the `mkdir <directory_name>` command',
          locale: 'en',
        },
        {
          title: 'Ülesanne 5 - Kausta loomine',
          content: 'Loo uus kaust nimega `my_folder`.',
          hint: 'Kausta loomiseks saab kasutada käsku `mkdir <kausta_nimi>`',
          locale: 'et',
        },

      ],
    },
    {
      task: { regex: /user@terminal.+?\/my_folder.*?\$/.source },
      translations: [
        {
          title: 'Task 6 - Moving between directories',
          content: 'Move to the directory you created, `my_folder`.',
          hint: 'To move between directories, you can use the `cd <directory_name>` command',
          locale: 'en',
        },
        {
          title: 'Ülesanne 6 - Kaustade vahel liikumine',
          content: 'Liigu oma loodud kausta `my_folder`.',
          hint: 'Kaustade vahel liikumiseks saab kasutada käsku `cd <kausta_nimi>`',
          locale: 'et',
        },
      ],
    },
    {
      task: { regex: /\/home\/user\/\|DELETE\|simple_file/.source, watchPath: '/home/user' },
      translations: [
        {
          title: 'Task 7 - Deleting files',
          content: 'Move back to your home directory and try to delete the `simple_file` file.',
          hint: 'To move to your home directory, you can use the `cd` command without parameters and to delete a file, you can use the `rm <file_name>` command',
          locale: 'en',
        },
        {
          title: 'Ülesanne 7 - Faili kustutamine',
          content: 'Liigu tagasi oma kodukausta ja proovi kustutada fail `simple_file`.',
          hint: 'Kodukausta liikumiseks saab kasutada käsku `cd` ilma parameetriteta ja faili kustutamiseks saab kasutada käsku `rm <faili_nimi>`',
          locale: 'et',
        },
      ],
    },
    {
      task: { regex: /\/home\/user\/\|DELETE,ISDIR\|my_folder/.source, watchPath: '/home/user' },
      translations: [
        {
          title: 'Task 8 - Deleting directories',
          content: 'Try to delete the directory you created, `my_folder`.',
          hint: 'Try to use the `rm` command from the previous task with the `-r` parameter',
          locale: 'en',
        },
        {
          title: 'Ülesanne 8 - Kausta kustutamine',
          content: 'Proovi kustutada oma loodud kaust `my_folder`.',
          hint: 'Proovi kasutada eelmise ülesande käsku `rm` koos parameetriga `-r`',
          locale: 'et',
        },
      ],
    },
    {
      task: { regex: /\d+\s+history\s/.source },
      translations: [
        {
          title: 'Task 9 - Command history',
          content: 'Display your recent command line commands.',
          hint: 'To display the command history, you can use the `history` command',
          locale: 'en',
        },
        {
          title: 'Ülesanne 9 - Käskude ajalugu',
          content: 'Kuva oma viimased käsurea käsud.',
          hint: 'Käskude ajaloo kuvamiseks saab kasutada käsku `history`',
          locale: 'et',
        },
      ],
    },
    {
      task: { regex: /PID\s+TTY\s+TIME\s+CMD/.source },
      translations: [
        {
          title: 'Task 10 - Processes',
          content: 'Display all running processes.',
          hint: 'To display all running processes, you can use the `ps` command',
          locale: 'en',
        },
        {
          title: 'Ülesanne 10 - Protsessid',
          content: 'Kuva kõik käimasolevad protsessid.',
          hint: 'Kõikide käimasolevate protsesside kuvamiseks saab kasutada käsku `ps`',
          locale: 'et',
        },
      ],
    },
  ],
};
