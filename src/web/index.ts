import express, { Request, Response, NextFunction } from 'express'
import CydiaRouter from './routes/CydiaRouter'
import PackageRouter from './routes/PackageRouter'
import AuthRouter from './routes/AuthRouter'
import CustomError from '../errors/CustomError'
import logger from '../log'
import config from '../config'
import morgan from 'morgan'
import cors from 'cors'

const app = express()

if (config.server.trustProxy !== false) {
  app.set('trust proxy', config.server.trustProxy) // Respects X-Forwarded-For
  if (config.server.trustProxyHops) {
    app.set('trust proxy', config.server.trustProxyHops)
  }
}

//if (process.env.NODE_ENV !== 'production') {
app.use(morgan('combined'))
//}

app.use(
  cors({
    origin: config.frontendURL
  })
)

app.use('/', CydiaRouter)
app.use('/package', PackageRouter)
app.use('/auth', AuthRouter)

app.get('/health', (req, res) => {
  return res.status(200).send('healthy')
})

app.use(
  async (error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error in express app', { error })
    if (error instanceof CustomError) {
      let fields = []
      if (typeof (error as any)['field'] !== 'undefined') {
        // why
        fields = (error as any).field
      }
      let formikErrors = {} as { [x: string]: string }
      fields.forEach((field: string) => {
        formikErrors[field] = error.message
      })
      return res.status(error.status).json({
        errors: [error.message],
        fields,
        formikErrors
      })
    }
    return res.status(500).json({
      errors: [error.message]
    })
  }
)
export default app
