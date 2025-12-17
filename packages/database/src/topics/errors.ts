export class TopicNotFoundError extends Error {
  constructor(message = 'Topic not found') {
    super(message);
    this.name = 'TopicNotFoundError';
  }
}
