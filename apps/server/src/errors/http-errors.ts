import { DomainError } from '@clawreview/core';

export interface HttpErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export function toHttpErrorBody(error: unknown): HttpErrorBody {
  if (error instanceof DomainError) {
    return {
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  if (error instanceof Error) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    };
  }

  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unknown error',
    },
  };
}
