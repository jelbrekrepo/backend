export default class CustomError extends Error {
  constructor(message: string | undefined) {
    super(message)

    this.name = this.constructor.name

    Error.captureStackTrace(this, this.constructor)
  }
}
