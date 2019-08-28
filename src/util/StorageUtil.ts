import { Storage, File } from '@google-cloud/storage'
import config from '../config'
import { Package } from '../database/entities/Package'
import { PackageVersion } from '../database/entities/PackageVersion'
import moment from 'moment'
const storage = new Storage({
  projectId: config.storage.gcs.project,
  credentials: {
    client_email: config.storage.gcs.email,
    private_key: config.storage.gcs.privateKey!.replace(/\\n/gi, '\n')
  }
})
const bucket = storage.bucket(config.storage.gcs.bucket!)

export async function uploadPackage(
  pkg: Package,
  version: PackageVersion,
  data: Buffer
): Promise<File> {
  return new Promise((resolve, reject) => {
    let file = bucket.file(
      `/${pkg.id}/${pkg.packageId}_${version.version}_iphoneos-arm.deb`
    )
    let stream = file.createWriteStream({
      metadata: {
        contentType: 'application/octet-stream'
      },
      resumable: false
    })
    stream.on('error', err => {
      reject(err)
    })
    stream.on('finish', () => {
      resolve(file)
    })
    stream.end(data)
  })
}
export async function upload(
  pkg: Package,
  version: PackageVersion,
  data: Buffer
): Promise<void> {
  await uploadPackage(pkg, version, data)
  return
}

export async function getPackageUrl(
  pkg: Package,
  version: PackageVersion
): Promise<string> {
  let [url] = await bucket
    .file(`/${pkg.id}/${pkg.packageId}_${version.version}_iphoneos-arm.deb`)
    .getSignedUrl({
      action: 'read',
      expires: moment()
        .add(15, 'minutes')
        .toDate()
    })
  console.log(url)
  return url
}
