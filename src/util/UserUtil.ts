import { User } from '../database/entities/User'
import { generateId, generateSecureString } from '.'
import argon2 from 'argon2'
import SignUpError from '../errors/SignUpError'
import jwt from 'jsonwebtoken'
import config from '../config'
import { NextFunction, Request, Response } from 'express'
import logger from '../log'
import sgMail from '@sendgrid/mail'
import { stripIndents } from 'common-tags'

const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export async function userForEmail(email: string): Promise<User | boolean> {
  let user = await User.findOne({
    email
  })
  if (!user) return false
  return user
}
export async function userForUsername(
  username: string
): Promise<User | boolean> {
  let user = await User.findOne({
    username
  })
  if (!user) return false
  return user
}

export async function register(
  username: string,
  password: string,
  email: string,
  ip: string
): Promise<User> {
  if (username.length < 3) {
    throw new SignUpError(
      'Username must be longer than 2 characters',
      'username'
    )
  } else if (username.length > 20) {
    throw new SignUpError(
      'Username must be shorter than 21 characters',
      'username'
    )
  }
  if (!email.match(EMAIL_REGEX)) {
    throw new SignUpError('Email is invalid', 'email')
  }
  if (password.length < 5) {
    throw new SignUpError(
      'Password must be longer than 4 characters',
      'password'
    )
  }
  let userEmail = await userForEmail(email)
  if (!!userEmail) {
    throw new SignUpError('Email already exists', 'email')
  }
  let userUsername = await userForUsername(email)
  if (!!userUsername) {
    throw new SignUpError('Username already exists', 'username')
  }

  let user = new User()
  user.id = generateId()
  user.username = username
  user.password = password
  user.email = email
  user.password = await argon2.hash(password)
  user.emailVerificationToken = generateSecureString()
  user.passwordResetToken = generateSecureString()
  user.displayName = username
  user.registrationIP = ip
  user.usedIPs = user.usedIPs || []
  user.usedIPs.push(ip)
  user = await user.save()

  // Send email with verification link
  if (config.sendgrid.enabled) {
    sgMail.setApiKey(config.sendgrid.key!)
    let verifyUrl = `${config.baseURL}/auth/verify?token=${user.emailVerificationToken}`
    await sgMail.send({
      to: user.email,
      from: config.sendgrid.from!,
      subject: 'Jelbrek Repo: verify your email',
      html: stripIndents`Hi, <strong>${user.username}</strong>,
      <br/>Someone with your email signed up at <a href="${config.frontendURL}">Jelbrek</a> (hopefully you!)
      <br/>If it wasn't you, disregard this email.
      <br/>If it was you, click <a href="${verifyUrl}">to verify your email</a>.
      <br/>Alternatively, copy and paste this into your address bar: ${verifyUrl}`
    })
  }
  return user
}

export function generateToken(user: User): string {
  const token = jwt.sign(
    {
      user: user.id
    },
    config.secret,
    {
      expiresIn: '7d',
      audience: 'jelbrek.sessions',
      issuer: `${config.snowflakes.datacenter}-${config.snowflakes.worker}`
    }
  )
  return token
}

export async function verifyToken(token: string): Promise<User | boolean> {
  try {
    const payload = jwt.verify(token, config.secret, {
      audience: 'jelbrek.sessions'
    }) as {
      user: string
    }
    const user = await User.findOne({
      id: payload.user
    })
    if (!user) return false
    return user
  } catch (err) {
    return false
  }
}

export function authMiddleware(fn?: (user: User) => boolean) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token: string = ''
      if (req.query.token) {
        token = req.query.token
      }
      if (req.headers.authorization) {
        token = req.headers.authorization
      }
      if (token === '') {
        return res.status(401).json({
          errors: ['no authorization']
        })
      }
      let user = await verifyToken(token)
      if (!user) {
        return res.status(401).json({
          errors: ['no authorization']
        })
      }
      req.user = user as User
      if (!fn) {
        return next()
      }
      let resp = fn(user as User)
      if (!resp) {
        return res.status(401).json({
          errors: ['no authorization']
        })
      }
      return next()
    } catch (error) {
      logger.error('Unexpected error in auth middleware', { error })
      return res.status(500).json({
        errors: [error.message]
      })
    }
  }
}

export function userMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token: string = ''
      if (req.query.token) {
        token = req.query.token
      }
      if (req.headers.authorization) {
        token = req.headers.authorization
      }
      if (token === '') {
        return next()
      }
      let user = await verifyToken(token)
      if (!user) {
        return next()
      }
      req.user = user as User
      return next()
    } catch (error) {
      logger.error('Unexpected error in auth middleware', { error })
      return res.status(500).json({
        errors: [error.message]
      })
    }
  }
}

export function developerMiddleware() {
  return authMiddleware(user => user.developer)
}

export function adminMiddleware() {
  return authMiddleware(user => user.admin)
}
