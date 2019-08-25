import { createConnection } from 'typeorm'
import Config from '../config'

export default async function() {
  return createConnection({
    type: 'postgres',
    host: Config.database.host,
    port: Config.database.port,
    username: Config.database.username,
    password: Config.database.password,
    database: Config.database.database,
    synchronize: true,
    logging: false,
    entities: [__dirname + '/entities/**/*.ts'],
    migrations: [__dirname + '/migrations/**/*.ts'],
    subscribers: [__dirname + '/subscribers/**/*.ts']
  })
}
