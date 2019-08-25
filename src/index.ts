import 'reflect-metadata'
import 'express-async-errors'
import app from './web'
import createDatabase from './database'
import config from './config'
import logger from './log'

const databaseProfiler = logger.startTimer()
createDatabase() // Initialize the database connection
  .then(() => {
    databaseProfiler.done({
      message: 'Created database'
    })
    app.listen(config.server.port, () => {
      logger.info(
        `Webserver has started and is listening on port ${config.server.port}`
      )
    })
  })
  .catch(error => {
    logger.error(
      'An error occurred while initializing the database connection, the app cannot start.',
      { error }
    )
    process.exit(1)
  })
