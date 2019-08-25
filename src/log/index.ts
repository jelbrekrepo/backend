import winston, { format } from 'winston'
const logger = winston.createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

// https://github.com/winstonjs/winston/issues/1338#issuecomment-506354691
// Custom format function that will look for an error object and log out the stack and if
// its not production, the error itself
const myFormat = format.printf(info => {
  const { timestamp: tmsmp, level, message, error, ...rest } = info
  let log = `${tmsmp} - ${level}:\t${message}`
  // Only if there is an error
  if (error) {
    if (error.stack) log = `${log}\n${error.stack}`
    if (process.env.NODE_ENV !== 'production')
      log = `${log}\n${JSON.stringify(error, null, 2)}`
  }
  // Check if rest is object
  if (!(Object.keys(rest).length === 0 && rest.constructor === Object)) {
    log = `${log}\n${JSON.stringify(rest, null, 2)}`
  }
  return log
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: format.combine(format.timestamp(), myFormat),
      handleExceptions: true
    })
  )
}
export default logger
