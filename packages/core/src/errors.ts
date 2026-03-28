export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  public constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class DomainConflictError extends DomainError {
  public constructor(code: string, message: string) {
    super(code, message, 409);
    this.name = 'DomainConflictError';
  }
}
