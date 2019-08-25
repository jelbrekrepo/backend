import CustomError from './CustomError'

export default class PackageNotFoundError extends CustomError {
  field: string | string[]
  constructor(message?: string) {
    super(message || 'Package does not exist', 404)
  }
}
