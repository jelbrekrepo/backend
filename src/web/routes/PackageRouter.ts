import express from 'express'
import bodyParser from 'body-parser'
import { developerMiddleware } from '../../util/UserUtil'
import {
  createPackage,
  getPackageFromId,
  createPackageVersion
} from '../../util/CydiaUtil'
import PackageCreateError from '../../errors/PackageCreateError'
import { Package } from '../../database/entities/Package'
import PackageNotFoundError from '../../errors/PackageNotFoundError'
import { Device } from '../../database/entities/Device'
import NotAuthorizedError from '../../errors/NotAuthorizedError'
import {
  getPackageUrl,
  uploadPackage,
  uploadIcon
} from '../../util/StorageUtil'
import multer from 'multer'
import crypto from 'crypto'
import { getDebPackage } from '../../util/DebUtil'
import config from '../../config'
const PackageRouter = express.Router()

const upload = multer()

PackageRouter.use(bodyParser.json())
PackageRouter.use(
  bodyParser.urlencoded({
    extended: true
  })
)

PackageRouter.route('/').get(async (req, res) => {
  let packages = await Package.find({
    where: {
      approved: true,
      private: false
    },
    relations: ['author', 'versions']
  })
  return res.status(200).json({
    message: 'OK',
    packages: packages.map(pkg => pkg.serialize())
  })
})
PackageRouter.route('/mine').get(developerMiddleware(), async (req, res) => {
  let packages = await Package.find({
    where: {
      approved: true,
      private: false
    },
    relations: ['author', 'versions']
  })
  packages = packages.filter(pkg => pkg.author.id === req.user.id)
  return res.status(200).json({
    message: 'OK',
    packages: packages.map(pkg => pkg.serialize())
  })
})
PackageRouter.route('/featured').get(async (req, res) => {
  let packages = await Package.find({
    where: {
      approved: true,
      private: false,
      featured: true
    },
    relations: ['author', 'versions']
  })
  return res.status(200).json({
    message: 'OK',
    packages: packages.map(pkg => pkg.serialize())
  })
})

PackageRouter.route('/:id')
  .get(async (req, res) => {
    let pkg = await getPackageFromId(req.params.id)
    let serialized = pkg.serialize() as { [x: string]: any }
    if (pkg.latestVersionId) {
      serialized.latestVersion = pkg.versions
        .find(
          v => v.id === pkg.latestVersionId || v.version === pkg.latestVersionId
        )!
        .serializeFromPackage()
    }
    return res.status(200).json({
      message: 'OK',
      package: serialized
    })
  })
  .put(developerMiddleware(), async (req, res) => {
    if (!req.body) {
      throw new PackageCreateError('Body does not exist', [])
    }
    if (!req.body.name) {
      throw new PackageCreateError('No package name', 'name')
    }
    if (!req.body.description) {
      throw new PackageCreateError('No package description', 'description')
    }
    if (!req.body.section) {
      throw new PackageCreateError('No package section', 'section')
    }
    const pkg = await createPackage(req.user, req.ip, {
      id: req.params.id,
      name: req.body.name,
      description: req.body.description,
      section: req.body.section
    })
    return res.status(200).json({
      message: 'Successfully created package',
      package: pkg.serialize()
    })
  })
  .patch(developerMiddleware(), async (req, res) => {
    let pkg = await getPackageFromId(req.params.id)
    if (pkg.author.id !== req.user.id) {
      throw new NotAuthorizedError()
    }
    if (req.body.depiction) {
      pkg.depiction = req.body.depiction
    }
    if (req.body.latestVersion) {
      pkg.latestVersionId = req.body.latestVersion
    }
    if (req.body.section) {
      pkg.section = req.body.section
    }
    if (req.body.description) {
      pkg.description = req.body.description
    }
    if (typeof req.body.private === 'boolean') {
      pkg.private = req.body.private
    }
    await pkg.save()
    return res.status(200).json({
      message: 'OK',
      package: pkg.serialize()
    })
  })
PackageRouter.route('/:id/versions').get(async (req, res) => {
  let pkg = await getPackageFromId(req.params.id)
  return res.status(200).json({
    message: 'OK',
    versions: pkg.versions.map(version => version.serialize())
  })
})

PackageRouter.route(['/:id/icon', '/:id/icon.png'])
  .get(async (req, res) => {
    let defaultImage = `https://${config.storage.gcs.bucket}.storage.googleapis.com/unknown.png`
    try {
      let pkg = await getPackageFromId(req.params.id)
      if (!pkg.icon) {
        return res.redirect(defaultImage)
      }
      return res.redirect(pkg.icon)
    } catch (err) {
      return res.redirect(defaultImage)
    }
  })
  .post(developerMiddleware(), upload.single('file'), async (req, res) => {
    let pkg = await getPackageFromId(req.params.id)
    if (pkg.author.id !== req.user.id) {
      throw new NotAuthorizedError()
    }
    if (!req.file || !req.file.buffer) {
      throw new Error('file not uploaded')
    }
    await uploadIcon(pkg, req.file.buffer)
    pkg.icon = `https://${config.storage.gcs.bucket}.storage.googleapis.com/${pkg.id}/icon.png`
    await pkg.save()
    return res.status(200).json({
      message: 'ok',
      package: pkg.serialize()
    })
  })

PackageRouter.route('/:id/versions/:version')
  .get(async (req, res) => {
    let pkg = await getPackageFromId(req.params.id)
    const version = pkg.versions.find(
      version =>
        version.id === req.params.version ||
        version.version === req.params.version
    )
    if (!version) throw new PackageNotFoundError('Package version not found')
    return res.status(200).json({
      message: 'OK',
      version
    })
  })
  .put(developerMiddleware(), async (req, res) => {
    let pkg = await getPackageFromId(req.params.id)
    if (pkg.author.id !== req.user.id) {
      throw new NotAuthorizedError()
    }
    let foundVersion = pkg.versions.find(
      version => version.version === req.params.version
    )
    if (foundVersion) {
      throw new Error('Version already exists on package')
    }
    let version = await createPackageVersion(req.ip, pkg, req.params.version)
    return res.status(200).json({
      message: 'OK',
      version: version.serialize()
    })
  })
  .patch(developerMiddleware(), async (req, res) => {
    let pkg = await getPackageFromId(req.params.id)
    if (pkg.author.id !== req.user.id) {
      throw new NotAuthorizedError()
    }
    let version = pkg.versions.find(
      version =>
        version.id === req.params.version ||
        version.version === req.params.version
    )
    if (!version) {
      throw new PackageNotFoundError('Package version not found')
    }
    if (req.body.tags && Array.isArray(req.body.tags)) {
      version.tags = req.body.tags
    }
    if (req.body.dependencies && Array.isArray(req.body.dependencies)) {
      version.dependencies = req.body.dependencies
    }
    if (req.body.changes) {
      version.changes = req.body.changes
    }
    if (req.body.minimumVersion) {
      version.minimumVersion = req.body.minimumVersion
    }
    if (req.body.maximumVersion) {
      version.maximumVersion = req.body.maximumVersion
    }
    await version.save()
    return res.status(200).json({
      message: 'OK',
      version: version.serialize()
    })
  })

PackageRouter.route('/:id/versions/:version/upload').post(
  developerMiddleware(),
  upload.single('file'),
  async (req, res) => {
    let pkg = await getPackageFromId(req.params.id)
    if (pkg.author.id !== req.user.id) {
      throw new NotAuthorizedError()
    }
    let version = pkg.versions.find(
      version =>
        version.id === req.params.version ||
        version.version === req.params.version
    )
    if (!version) {
      throw new PackageNotFoundError('Package version not found')
    }
    if (!req.file || !req.file.buffer) {
      throw new Error('file not uploaded')
    }
    let md5 = crypto.createHash('md5')
    let sha1 = crypto.createHash('sha1')
    let sha256 = crypto.createHash('sha256')

    let debPkg = await getDebPackage(req.file.buffer)
    version.size = req.file.buffer.byteLength
    version.installedSize = debPkg.installedSize
    version.dependencies = debPkg.dependencies
    version.md5sum = md5.update(req.file.buffer).digest('hex')
    version.sha1sum = sha1.update(req.file.buffer).digest('hex')
    version.sha256sum = sha256.update(req.file.buffer).digest('hex')

    await uploadPackage(pkg, version, req.file.buffer)
    await version.save()
    // TODO: implement uploading of packages
    return res.json({
      message: 'OK',
      package: pkg.serialize(),
      version: version.serializeFromPackage()
    })
  }
)
PackageRouter.route([
  '/:id/versions/:version/download',
  '/:id/versions/:version/download.deb'
]).get(async (req, res) => {
  let pkg = await getPackageFromId(req.params.id)
  const version = pkg.versions.find(
    version =>
      version.id === req.params.version ||
      version.version === req.params.version
  )
  if (!version) throw new PackageNotFoundError('Package version not found')

  let deviceFirmware = req.headers['X-Firmware'] as string
  let deviceMachine = req.headers['X-Machine'] as string
  let deviceUDID = req.headers['X-Unique-ID'] as string

  if (pkg.private) {
    // TODO: Paid package security using this logic
    // Private package -- only allow whitelisted UDIDs to download package
    // Check for device UDID existing in db
    let device = await Device.findOne({
      udid: deviceUDID
    })
    if (!device) {
      return res
        .status(401)
        .send(
          'Your device is not linked to a Jelbrek account, please link it and try again.'
        )
    }
    if (device.lastUsedFirmware !== deviceFirmware) {
      device.lastUsedFirmware = deviceFirmware
    }
    if (device.deviceType !== deviceMachine) {
      // Validate that device machine (X-Machine) matches the device type in the database
      return res
        .status(401)
        .send(
          'Device metadata mismatch, please contact a staff member in the Jelbrek discord.'
        )
    }
    if (!device.owner.usedIPs.includes(req.ip)) {
      // Validate that the downloader has logged onto their Jelbrek account on their current IP
      return res
        .status(401)
        .send(
          'Please login to your Jelbrek account at least once on the network you are currently on.'
        )
    }
    if (!pkg.allowedUDIDs.includes(deviceUDID)) {
      // Validate that the downloader's device is in the whitelist
      return res
        .status(401)
        .send(
          'Your device is not in the whitelist for the package you are attempting to download.'
        )
    }
  }

  let packageUrl = await getPackageUrl(pkg, version)
  return res.redirect(packageUrl)
})

export default PackageRouter
