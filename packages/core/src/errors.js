export class DomainError extends Error {
    code;
    statusCode;
    constructor(code, message, statusCode = 400) {
        super(message);
        this.name = 'DomainError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
export class DomainConflictError extends DomainError {
    constructor(code, message) {
        super(code, message, 409);
        this.name = 'DomainConflictError';
    }
}
