import CustomError from './CustomError'

export default class SignInError extends CustomError {
  field: string | string[]
  constructor(message: string, field: string | string[]) {
    super(message)
    if (typeof field === 'string') {
      this.field = [field]
    } else {
      this.field = field
    }
  }
}
