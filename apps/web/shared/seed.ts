export interface Task {
  id: number;
  title: string;
  content: string;
  hint?: string;
  completed: boolean;
}

export interface Topic {
  title: string;
  description: string;
  tasks: Task[];
}

export const topics = [
  {
    id: 1,
    slug: 'file-system-basics',
    title: 'File System Basics',
    description: 'Learn to navigate directories, create files and folders, and understand Linux file structure',
    progress: 60,
  },
  {
    id: 2,
    slug: 'file-permissions',
    title: 'File Permissions',
    description: 'Master file permissions, ownership, and access control with chmod, chown, and umask',
    progress: 25,
  },
  {
    id: 3,
    slug: 'text-processing',
    title: 'Text Processing',
    description: 'Work with text files using grep, sed, awk, and other powerful text manipulation tools',
    progress: 0,
  },
];

export const topicData: Record<string, Topic> = {
  'file-system-basics': {
    title: 'File System Basics',
    description: 'Learn to navigate directories, create files and folders, and understand Linux file structure',
    tasks: [
      {
        id: 1,
        title: 'Use pwd command',
        content: 'Learn to print your current working directory. The pwd (print working directory) command shows you exactly where you are in the file system.',
        hint: 'Simply type "pwd" and press Enter. You should see something like /home/user',
        completed: true,
      },
      {
        id: 2,
        title: 'List files with ls',
        content: 'View files and directories in your current location. The ls command is one of the most commonly used commands.',
        hint: 'Type "ls" to see files. Add "-la" for more details: ls -la',
        completed: true,
      },
      {
        id: 3,
        title: 'Navigate with cd',
        content: 'Change directories using the cd command. This is essential for moving around the file system.',
        hint: 'Type "cd /home" to go to the home directory. Use "cd ~" to return to your home.',
        completed: false,
      },
      {
        id: 4,
        title: 'Create directories',
        content: 'Learn to create new directories using the mkdir command. Organizing files into directories is fundamental.',
        hint: 'Use "mkdir practice" to create a directory. Use "mkdir -p parent/child" for nested directories.',
        completed: false,
      },
      {
        id: 5,
        title: 'Create files with touch',
        content: 'Create empty files using the touch command. This is useful for quickly creating new files.',
        hint: 'Type "touch myfile.txt" to create a file. Use "touch file1.txt file2.txt" for multiple files.',
        completed: false,
      },
      {
        id: 6,
        title: 'Understand file paths',
        content: 'Master absolute and relative paths. Understanding paths is crucial for effective navigation.',
        hint: 'Absolute paths start with /. Relative paths are relative to current location. ".." means parent directory.',
        completed: false,
      },
    ],
  },
  'file-permissions': {
    title: 'File Permissions',
    description: 'Master file permissions, ownership, and access control',
    tasks: [
      {
        id: 1,
        title: 'Read file permissions',
        content: 'Use ls -l to view and understand file permissions. Permissions control who can read, write, or execute files.',
        hint: 'Type "ls -l". The first column shows permissions like "-rw-r--r--". First character is file type, next 9 are permissions.',
        completed: false,
      },
      {
        id: 2,
        title: 'Make files executable',
        content: 'Learn to change file permissions using chmod. Making scripts executable is a common task.',
        hint: 'Use "chmod +x filename" to add execute permission for everyone.',
        completed: false,
      },
      {
        id: 3,
        title: 'Use numeric permissions',
        content: 'Set precise permissions using numeric notation (e.g., 755, 644). This is the most common way to set permissions.',
        hint: '755 means rwxr-xr-x (7=rwx, 5=r-x). Use "chmod 755 filename".',
        completed: false,
      },
      {
        id: 4,
        title: 'View file ownership',
        content: 'Learn to view and understand file ownership. Every file has an owner and a group.',
        hint: 'In "ls -l" output, the 3rd and 4th columns show the owner and group.',
        completed: false,
      },
    ],
  },
  'text-processing': {
    title: 'Text Processing',
    description: 'Work with text files using powerful manipulation tools',
    tasks: [
      {
        id: 1,
        title: 'Search with grep',
        content: 'Find patterns in text files using grep. grep is one of the most powerful text search tools.',
        hint: 'Use "grep word filename" to search. Add "-i" for case-insensitive: "grep -i word filename".',
        completed: false,
      },
      {
        id: 2,
        title: 'Use grep with regex',
        content: 'Master regular expressions with grep for advanced pattern matching.',
        hint: 'Try "grep ^word filename" to find lines starting with "word". Use "grep [0-9]" to find digits.',
        completed: false,
      },
      {
        id: 3,
        title: 'Replace text with sed',
        content: 'Edit text streams using sed substitution. sed is powerful for find-and-replace operations.',
        hint: 'Use "sed \'s/old/new/\' filename" to replace. Add "g" for all: "sed \'s/old/new/g\'".',
        completed: false,
      },
      {
        id: 4,
        title: 'Extract columns with awk',
        content: 'Process and analyze structured text using awk. awk excels at working with columnar data.',
        hint: 'Use "awk \'{print $1}\' filename" to print first column. Use -F to set delimiter: "awk -F: \'{print $1}\'".',
        completed: false,
      },
    ],
  },
};
