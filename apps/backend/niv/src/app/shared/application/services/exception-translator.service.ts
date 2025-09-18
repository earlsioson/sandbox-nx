// apps/backend/niv/src/app/shared/application/services/exception-translator.service.ts
import { Injectable } from '@nestjs/common';

/**
 * Application Service responsible for translating unknown error types
 * into typed messages that can be safely used throughout the application.
 *
 * This service solves TypeScript TS18046 errors while maintaining
 * hexagonal architecture principles by residing in the application layer.
 */
@Injectable()
export class ExceptionTranslator {
  /**
   * Safely extracts error message from unknown error type
   * Solves TS18046: 'error' is of type 'unknown'
   */
  static getMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }

    return 'Unknown error occurred';
  }

  /**
   * Safely extracts error stack from unknown error type
   */
  static getStack(error: unknown): string | undefined {
    if (error instanceof Error) {
      return error.stack;
    }
    return undefined;
  }

  /**
   * Checks if error indicates a network/connectivity issue
   * Useful for determining retry strategies
   */
  static isNetworkError(error: unknown): boolean {
    const message = this.getMessage(error);
    return /network|timeout|connection|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/.test(
      message.toLowerCase()
    );
  }

  /**
   * Checks if error indicates an authentication failure
   * Useful for token refresh logic
   */
  static isAuthenticationError(error: unknown): boolean {
    const message = this.getMessage(error);
    return /unauthorized|authentication|auth|token|credentials/.test(
      message.toLowerCase()
    );
  }

  /**
   * Creates a structured error context for logging
   */
  static createErrorContext(
    error: unknown,
    operation: string,
    entityType?: string
  ): {
    message: string;
    stack?: string;
    operation: string;
    entityType?: string;
    isNetworkError: boolean;
    isAuthError: boolean;
  } {
    return {
      message: this.getMessage(error),
      stack: this.getStack(error),
      operation,
      entityType,
      isNetworkError: this.isNetworkError(error),
      isAuthError: this.isAuthenticationError(error),
    };
  }
}
