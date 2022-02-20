export enum ErrorCode {
  PATH_DOES_NOT_EXIST = 'PM000001',
}

export class Error {
  private errorCode: ErrorCode;
  private errorMessage: string;


  constructor(errorCode: ErrorCode, errorMessage: string) {
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
  }
}

export interface Response<T> {
  success: boolean;
  error?: Error;
  data?: T;
}
