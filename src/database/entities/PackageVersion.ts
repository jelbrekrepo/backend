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
  size: number

  @Column()
  md5sum: string

  @Column()
  sha1sum: string

  @Column()
  sha256sum: string

  @Column()
  changes: string

  @Column({
    default: 0
  })
  downloads: number

  @Column()
  creationIP: string

  @Column()
  minimumVersion: string

  @Column()
  maximumVersion: string

  @ManyToOne(type => Package, pkg => pkg.versions)
  package: Package
}
