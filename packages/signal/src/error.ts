/* eslint-disable no-useless-constructor */
export class OldVersionError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class CircularError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class SSRError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class DependencyError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class SetError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class DataSourceSSRError extends Error {
  constructor(message?: string) {
    super(message);
  }
}
