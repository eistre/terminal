export interface EvaluatorTaskRecord {
  id: number;
  regex: string;
  watchPath: string | null;
  completed: boolean;
}
