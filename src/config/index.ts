import { config } from 'dotenv'
config()
export default {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    trustProxy:
      parseInt(process.env.TRUST_PROXY || '1', 10) === 1 ? true : false
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
  },
  snowflakes: {
    datacenter: parseInt(process.env.SNOWFLAKE_DATACENTER || '0', 10),
    worker: parseInt(process.env.SNOWFLAKE_WORKER || '0', 10)
  },
  secret: process.env.SECRET!
}
