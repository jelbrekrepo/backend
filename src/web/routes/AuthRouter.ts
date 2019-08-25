import express from 'express'
import { stripIndents } from 'common-tags'
import { repoInformation } from '../../util/CydiaUtil'

import bodyParser from 'body-parser'
import SignUpError from '../../errors/SignUpError'
import { register, generateToken } from '../../util/UserUtil'
import { User } from '../../database/entities/User'
import SignInError from '../../errors/SignInError'
import argon2 from 'argon2'
import { generateSecureString } from '../../util'

const AuthRouter = express.Router()

AuthRouter.use(bodyParser.json())
AuthRouter.use(
  bodyParser.urlencoded({
    extended: true
  })
)

AuthRouter.route('/register').post(async (req, res) => {
  try {
    let user = await register(
      req.body.username,
      req.body.password,
      req.body.email,
      req.ip
    )
    if (!user.emailVerified) {
      return res.status(200).json({
        message: 'Account is awaiting email verification'
      })
    }
    return res.status(200).json({
      message: 'Registration successful',
      token: generateToken(user)
    })
  } catch (err) {
    if (err instanceof SignUpError) {
      return res.status(400).json({
        errors: [err.message],
        fields: err.field
      })
    }
    return res.status(400).json({
      errors: [err.message]
    })
  }
})

AuthRouter.route('/login').post(async (req, res) => {
  try {
    let findObj = {
      [req.body.username.includes('@') ? 'email' : 'username']: req.body
        .username
    }
    const user = await User.findOne(findObj)
    if (!user) {
      throw new SignInError('Username or password is invalid', [
        'username',
        'password'
      ])
    }

    const passwordValid = await argon2.verify(user.password, req.body.password)
    if (!passwordValid) {
      throw new SignInError('Username or password is invalid', [
        'username',
        'password'
      ])
    }
    if (!user.emailVerified) {
      throw new SignInError('Email is not verified', 'username')
    }
    return res.status(200).json({
      message: 'Login successful',
      token: generateToken(user)
    })
  } catch (err) {
    if (err instanceof SignInError) {
      return res.status(400).json({
        errors: [err.message],
        fields: err.field
      })
    }
    return res.status(400).json({
      errors: [err.message]
    })
  }
})

AuthRouter.route('/verify').get(async (req, res) => {
  try {
    let user = await User.findOne({
      emailVerificationToken: req.query.token
    })
    if (!user) {
      throw new Error('Email verification token is invalid')
    }
    if (user.emailVerified) {
      throw new Error('Email is already verified')
    }
    user.emailVerificationToken = generateSecureString()
    user.emailVerified = true
    await user.save()
    return res.status(200).json({
      message: 'Email verified successfully',
      token: generateToken(user)
    })
  } catch (err) {
    return res.status(400).json({
      errors: [err.message]
    })
  }
})

export default AuthRouter
