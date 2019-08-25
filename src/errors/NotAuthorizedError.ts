import CustomError from './CustomError'

export default class NotAuthorizedError extends CustomError {
  constructor(message?: string) {
    super(message || 'Not authorized', 401)
  }
}
