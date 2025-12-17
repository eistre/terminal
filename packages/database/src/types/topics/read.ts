export interface Topic {
  id: number;
  slug: string;
  title: string;
  description: string;
  progress: number;
}

export interface TopicTask {
  id: number;
  title: string;
  content: string;
  hint: string | null;
  completed: boolean;
}

export interface TopicDetail {
  title: string;
  description: string;
  tasks: TopicTask[];
}
