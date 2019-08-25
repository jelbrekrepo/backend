import { Entity, Column, BaseEntity, PrimaryColumn, ManyToOne } from 'typeorm'
import { User } from './User'
import { Package } from './Package'

@Entity()
export class PackageVersion extends BaseEntity {
  @PrimaryColumn()
  id: string

  @Column()
  version: string

  @Column('text', {
    array: true,
    default: '{}'
  })
  dependencies: string[]

  @Column()
  size?: number

  @Column()
  md5sum?: string

  @Column()
  sha1sum?: string

  @Column()
  sha256sum?: string

  @Column({
    default: false
  })
  fileUploaded: boolean

  @Column()
  changes: string

  @Column({
    default: 0
  })
  downloads: number

  @Column()
  creationIP: string

  @Column()
  minimumVersion?: string

  @Column()
  maximumVersion?: string

  @Column('text', {
    array: true,
    default: '{}'
  })
  tags: string[]

  @ManyToOne(type => Package, pkg => pkg.versions)
  package: Package

  serialize() {
    return {
      id: this.id,
      version: this.version,
      dependencies: this.dependencies,
      size: this.size,
      md5sum: this.md5sum,
      sha1sum: this.sha1sum,
      sha256sum: this.sha256sum,
      changes: this.changes,
      downloads: this.downloads,
      minimumVersion: this.minimumVersion,
      maximumVersion: this.maximumVersion,
      package: {
        id: this.package.id,
        packageId: this.package.packageId,
        author: {
          id: this.package.author.id,
          username: this.package.author.username,
          displayName: this.package.author.displayName
        }
      }
    }
  }
}
