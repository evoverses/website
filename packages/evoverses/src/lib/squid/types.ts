export type SquidError = {
  message: string;
  extensions: {
    code: string;
    exception: {
      stacktrace: string[];
    };
  }
}

export type SquidErrorResponse = {
  errors: SquidError[];
}
