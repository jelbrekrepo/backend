import { Package } from '../database/entities/Package'
import { generateId } from '.'
import { User } from '../database/entities/User'
import PackageNotFoundError from '../errors/PackageNotFoundError'
import { PackageVersion } from '../database/entities/PackageVersion'
import zlib from 'zlib'
import { Bzip2 } from 'compressjs'
import { stripIndents } from 'common-tags'
import config from '../config'

const bzip2 = (input: Buffer) => {
  let buf = Buffer.from(Bzip2.compressFile(input))
  return buf
}
const gzip = (input: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    zlib.gzip(Buffer.from(input), (err, buf) => {
      if (err) return reject(err)
      return resolve(buf)
    })
  })
}

export function repoInformation() {
  // TODO: grab information from Config in database
  return {
    Origin: 'Jelbrek Repository',
    Label: 'Jelbrek Repository',
    Suite: 'stable',
    Version: '1.0',
    Codename: 'jelbrek',
    Architectures: 'iphoneos-arm',
    Components: 'main',
    Description: 'jelbrek.com repository'
  }
}

export interface CreatePackageData {
  id: string
  name: string
  description: string
  section: string
}

export async function createPackage(
  author: User,
  ip: string,
  data: CreatePackageData
): Promise<Package> {
  let pkg = new Package()
  pkg.id = generateId()
  pkg.author = author
  pkg.creationIP = ip
  pkg.packageId = data.id
  pkg.name = data.name
  pkg.description = data.description
  pkg.section = data.section
  pkg.versions = []
  pkg.depiction = ''
  pkg.allowedUDIDs = []
  pkg.creationDate = new Date()
  pkg = await pkg.save()
  return pkg
}

export async function createPackageVersion(
  ip: string,
  pkg: Package,
  version: string
): Promise<PackageVersion> {
  let pkgVersion = new PackageVersion()
  pkgVersion.id = generateId()
  pkgVersion.version = version
  pkgVersion.package = pkg
  pkgVersion.creationIP = ip
  pkgVersion.changes = ''
  pkgVersion.dependencies = []
  pkgVersion.tags = []
  pkgVersion.creationDate = new Date()
  pkgVersion = await pkgVersion.save()
  return pkgVersion
}

export async function getPackageFromId(id: string): Promise<Package> {
  let bundleIdPkg = await Package.findOne({
    where: {
      packageId: id
    },
    relations: ['author', 'versions']
  })
  if (!bundleIdPkg) {
    let realIdPkg = await Package.findOne({
      where: {
        id
      },
      relations: ['author', 'versions']
    })
    if (!realIdPkg) {
      throw new PackageNotFoundError()
    }
    return realIdPkg
  }
  return bundleIdPkg
}

export async function createPackages(): Promise<Buffer> {
  const packages = await Package.find({
    relations: ['author', 'versions']
  })
  let buf = ''
  await Promise.all(
    packages.map(async pkg => {
      await Promise.all(
        pkg.versions.map(async version => {
          buf += `Package: ${pkg.packageId}\n`
          buf += `Name: ${pkg.name}\n`
          if (
            version.dependencies &&
            Array.isArray(version.dependencies) &&
            version.dependencies.length > 0
          )
            buf += `Depends: ${version.dependencies.join(', ')}\n`
          buf += 'Architecture: iphoneos-arm\n'
          buf += `Description: ${pkg.description}\n`
          // TODO: Maintainer should be changed to the repo maintainer
          //buf += `Maintainer: ${pkg.author.displayName} <${pkg.author.email}>\n`
          buf += `Author: ${pkg.author.displayName} <${pkg.author.email}>\n`
          buf += `Section: ${pkg.section}\n`
          buf += `Version: ${version.version}\n`
          if (version.installedSize !== null) {
            buf += `Installed-Size: ${version.installedSize}\n`
          }
          buf += `SHA256: ${version.sha256sum}\n`
          buf += `SHA1: ${version.sha1sum}\n`
          buf += `MD5sum: ${version.md5sum}\n`
          buf += `Depiction: ${config.frontendURL}/package/${pkg.packageId}\n`
          if (version.size !== null) {
            buf += `Size: ${version.size}\n`
          }
          buf += `Filename: packages/${pkg.id}/download/${version.id}\n`
          if (
            version.tags &&
            Array.isArray(version.tags) &&
            version.tags.length > 0
          )
            buf += `Tag: ${version.tags.join(', ')}\n`
          buf += '\n'
        })
      )
    })
  )
  return Buffer.from(buf, 'utf8')
}

export async function getPackages(type: string = 'raw'): Promise<Buffer> {
  // TODO: implement caching in redis for packages.?(bz2|gz)
  const packagesRaw = await createPackages()
  if (type === 'gz') {
    return gzip(packagesRaw)
  } else if (type === 'bz2') {
    return bzip2(packagesRaw)
  } else {
    return packagesRaw
  }
}
