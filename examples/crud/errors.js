
export class BadRequestError extends Error {
  constructor(message) {
    super(message)
    this.name = 'BadRequestError'
    if(Error.captureStackTrace) {
      Error.captureStackTrace(this, BadRequestError)
    }
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NotFoundError'
    if(Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError)
    }
  }
}