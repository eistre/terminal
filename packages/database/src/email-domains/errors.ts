export class EmailDomainNotFoundError extends Error {
  constructor(message = 'Email domain not found') {
    super(message);
    this.name = 'EmailDomainNotFoundError';
  }
}

export class EmailDomainConflictError extends Error {
  constructor(message = 'Email domain already exists') {
    super(message);
    this.name = 'EmailDomainConflictError';
  }
}
