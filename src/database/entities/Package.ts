import {
  Entity,
  Column,
  BaseEntity,
  PrimaryColumn,
  ManyToOne,
  OneToMany
} from 'typeorm'
import { User } from './User'
import { PackageVersion } from './PackageVersion'

@Entity()
export class Package extends BaseEntity {
  @PrimaryColumn()
  id: string

  @Column()
  packageId: string

  @Column()
  description: string

  @Column()
  depiction: string

  @Column()
  section: string

  @Column({
    default: false
  })
  approved: boolean

  @Column({
    default: false
  })
  private: boolean

  @Column('text', {
    array: true,
    default: '{}'
  })
  allowedUDIDs: string[]

  @Column({
    default: 0
  })
  downloads: number

  @Column()
  creationIP: string

  @ManyToOne(type => User, user => user.packages)
  author: User

  @OneToMany(type => PackageVersion, pkgVersion => pkgVersion.package)
  versions: PackageVersion[]

  serialize() {
    return {
      id: this.id,
      packageId: this.packageId,
      description: this.description,
      depiction: this.depiction,
      section: this.section,
      approved: this.approved,
      private: this.private,
      downloads: this.downloads,
      author: {
        id: this.author.id,
        username: this.author.username,
        displayName: this.author.displayName
      },
      versions: this.versions
    }
  }
}
