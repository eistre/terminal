export interface TopicSummary {
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

export interface TopicDetails {
  title: string;
  description: string;
  tasks: TopicTask[];
}
