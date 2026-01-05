export class TopicNotFoundError extends Error {
  constructor(message = 'Topic not found') {
    super(message);
    this.name = 'TopicNotFoundError';
  }
}

export class TopicSlugConflictError extends Error {
  constructor(message = 'Topic slug already exists') {
    super(message);
    this.name = 'TopicSlugConflictError';
  }
}
