import { Package } from '../database/entities/Package'
import { generateId } from '.'
import { User } from '../database/entities/User'
import PackageNotFoundError from '../errors/PackageNotFoundError'
import { PackageVersion } from '../database/entities/PackageVersion'

export function repoInformation() {
  // TODO: grab information from Config in database
  return {
    Origin: 'Jelbrek Repository',
    Label: 'Jelbrek Repository',
    Suite: 'stable',
    Version: '1.0',
    Codename: 'ios',
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
  pkgVersion.package = pkg
  pkgVersion.creationIP = ip
  pkgVersion.changes = ''
  pkgVersion.dependencies = []
  pkgVersion.tags = []
  pkgVersion = await pkgVersion.save()
  return pkgVersion
}

export async function getPackageFromId(id: string): Promise<Package> {
  let bundleIdPkg = await Package.findOne({
    packageId: id
  })
  if (!bundleIdPkg) {
    let realIdPkg = await Package.findOne({
      id
    })
    if (!realIdPkg) {
      throw new PackageNotFoundError()
    }
    return realIdPkg
  }
  return bundleIdPkg
}

export async function createPackages() {
  const packages = Package.find()
}

export async function getPackages() {
  // TODO: implement caching in redis for packages.?(bz2|gz)
  const packagesRaw = await createPackages()
}
