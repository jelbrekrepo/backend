import express from 'express'
import CydiaRouter from './routes/CydiaRouter'
import PackageRouter from './routes/PackageRouter'
import AuthRouter from './routes/AuthRouter'

const app = express()

app.use('/', CydiaRouter)
app.use('/package', PackageRouter)
app.use('/auth', AuthRouter)
export default app
