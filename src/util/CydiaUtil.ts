import { Package } from '../database/entities/Package'
import { generateId } from '.'
import { User } from '../database/entities/User'

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
  pkg.description = data.description
  pkg.section = data.section
  pkg.versions = []
  pkg.depiction = ''
  pkg = await pkg.save()
  return pkg
}

export async function createPackages() {
  const packages = Package.find()
}

export async function getPackages() {
  // TODO: implement caching in redis for packages.?(bz2|gz)
  const packagesRaw = await createPackages()
}
