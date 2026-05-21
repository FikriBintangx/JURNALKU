export enum AIErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_JSON = 'INVALID_JSON',
  PROVIDER_TIMEOUT = 'PROVIDER_TIMEOUT',
  NO_RESULT = 'NO_RESULT',
  SCHEMA_ERROR = 'SCHEMA_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export class AIError extends Error {
  constructor(
    public type: AIErrorType,
    public message: string,
    public provider?: string,
    public rawError?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}
