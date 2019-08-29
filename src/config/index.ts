import { config } from 'dotenv'
config()
export default {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    trustProxy: !process.env.TRUST_PROXY ? false : process.env.TRUST_PROXY,
    trustProxyHops: parseInt(process.env.TRUST_PROXY_HOPS || '3', 10)
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
  storage: {
    type: process.env.STORAGE_TYPE === 's3' ? 's3' : 'gcs',
    gcs: {
      bucket: process.env.STORAGE_GCS_BUCKET,
      project: process.env.STORAGE_GCS_PROJECT,
      email: process.env.STORAGE_GCS_EMAIL,
      privateKey: process.env.STORAGE_GCS_PRIVATEKEY
    }
  },
  sendgrid: {
    from: process.env.SENDGRID_FROM,
    key: process.env.SENDGRID_API_KEY,
    enabled: process.env.SENDGRID_ENABLED === '1'
  },
  secret: process.env.SECRET!,
  frontendURL: process.env.FRONTEND_URL!,
  baseURL: process.env.BASE_URL!
}
