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
import { PackageVersion } from '../../database/entities/PackageVersion'
import NotAuthorizedError from '../../errors/NotAuthorizedError'

const PackageRouter = express.Router()

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

PackageRouter.route('/:id')
  .get(async (req, res) => {
    let pkg = await getPackageFromId(req.params.id)
    return res.status(200).json({
      message: 'OK',
      package: pkg.serialize()
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
PackageRouter.route('/:id/versions').get(async (req, res) => {
  let pkg = await getPackageFromId(req.params.id)
  return res.status(200).json({
    message: 'OK',
    versions: pkg.versions.map(version => version.serialize())
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
    let version = await createPackageVersion(req.ip, pkg, req.params.version)
    return res.status(200).json({
      message: 'OK',
      version
    })
  })
PackageRouter.route('/:id/versions/:version/download').get(async (req, res) => {
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

  // TODO: Implement downloading of package versions
  return res.send('download')
})

export default PackageRouter
