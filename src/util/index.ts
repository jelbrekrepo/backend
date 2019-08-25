import FlakeId from 'flake-idgen'
import Config from '../config'
import crypto from 'crypto'

const idGen = new FlakeId({
  datacenter: Config.snowflakes.datacenter,
  worker: Config.snowflakes.worker
})

export function generateId() {
  let buf = idGen.next()
  let uint = buf.readBigUInt64BE(0)
  let str = uint.toString()
  return str
}
export function generateSecureString() {
  return crypto.randomBytes(24).toString('hex')
}
