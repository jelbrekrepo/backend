import express from 'express'
import bodyParser from 'body-parser'
import { userMiddleware } from '../../util/UserUtil'

const UsersRouter = express.Router()

UsersRouter.use(bodyParser.json())
UsersRouter.use(
  bodyParser.urlencoded({
    extended: true
  })
)

UsersRouter.route('/@me').get(userMiddleware(), async (req, res) => {
  return res.status(200).json({
    message: 'ok',
    user: req.user.serialize()
  })
})

export default UsersRouter
