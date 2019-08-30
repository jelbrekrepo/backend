import { Entity, Column, BaseEntity, PrimaryColumn, OneToMany } from 'typeorm'
import { Package } from './Package'
import { PackageVersion } from './PackageVersion'
import { Device } from './Device'

@Entity()
export class User extends BaseEntity {
  @PrimaryColumn()
  id: string

  @Column()
  username: string

  @Column()
  email: string

  @Column()
  emailVerificationToken: string

  @Column({ default: false })
  emailVerified: boolean

  @Column()
  password: string

  @Column({ default: false })
  passwordResetPending: boolean

  @Column()
  passwordResetToken: string

  @Column()
  displayName: string

  @Column({
    default: false
  })
  developer: boolean

  @Column({
    default: false
  })
  moderator: boolean

  @Column({
    default: false
  })
  admin: boolean

  @Column()
  registrationIP: string // Tracks IP to prevent piracy

  @Column('text', {
    array: true,
    default: '{}'
  }) // Tracks used IPs to prevent piracy
  usedIPs: string[]

  @OneToMany(type => Device, device => device.owner)
  devices: Device[]

  @OneToMany(type => Package, pkg => pkg.author)
  packages: Package[]

  serialize() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      displayName: this.displayName,
      developer: this.developer,
      moderator: this.moderator,
      admin: this.admin
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      user: User
    }
  }
}
