import {
  Entity,
  Column,
  BaseEntity,
  PrimaryColumn,
  OneToMany,
  ManyToOne
} from 'typeorm'
import { Package } from './Package'
import { PackageVersion } from './PackageVersion'
import { User } from './User'

@Entity()
export class Device extends BaseEntity {
  @PrimaryColumn()
  id: string

  @Column()
  lastUsedFirmware: string

  @Column()
  deviceType: string

  @Column() // Tracks UDID for paid packages
  udid: string

  @Column() // Tracks IP that added device to account (to prevent piracy)
  creationIP: string

  @ManyToOne(type => User, user => user.devices)
  owner: User
}
