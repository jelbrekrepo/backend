import express from 'express'
import bodyParser from 'body-parser'
import { developerMiddleware } from '../../util/UserUtil'
import { createPackage } from '../../util/CydiaUtil'
import PackageCreateError from '../../errors/PackageCreateError'

const PackageRouter = express.Router()

PackageRouter.use(bodyParser.json())
PackageRouter.use(
  bodyParser.urlencoded({
    extended: true
  })
)

PackageRouter.route('/create').put(developerMiddleware(), async (req, res) => {
  try {
    if (!req.body) {
      throw new PackageCreateError('Body does not exist', [])
    }
    if (!req.body.id) {
      throw new PackageCreateError('No package ID', 'id')
    }
    if (!req.body.description) {
      throw new PackageCreateError('No package description', 'description')
    }
    if (!req.body.section) {
      throw new PackageCreateError('No package section', 'section')
    }
    const pkg = await createPackage(req.user, req.ip, {
      id: req.body.id,
      description: req.body.description,
      section: req.body.section
    })
    return res.status(200).json({
      message: 'Successfully created package',
      ...pkg.serialize()
    })
  } catch (err) {
    if (err instanceof PackageCreateError) {
      return res.status(400).json({
        errors: [err.message],
        fields: err.field
      })
    }
    return res.status(400).json({
      errors: [err.message]
    })
  }
})

export default PackageRouter
