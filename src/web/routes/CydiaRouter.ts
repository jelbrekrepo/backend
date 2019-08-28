import express from 'express'
import { stripIndents } from 'common-tags'
import { repoInformation, getPackages } from '../../util/CydiaUtil'

const CydiaRouter = express.Router()
CydiaRouter.route(['/Release', '/./Release']).get((req, res) => {
  const info = repoInformation()
  res.send(stripIndents`Origin: ${info.Origin}
  Label: ${info.Label}
  Suite: ${info.Suite}
  Version: ${info.Version}
  Codename: ${info.Codename}
  Architectures: ${info.Architectures}
  Components: ${info.Components}
  Description: ${info.Description}\n`)
})

CydiaRouter.route(['/Packages', '/./Packages']).get(async (req, res) => {
  const packages = await getPackages('raw')
  return res.contentType('application/octet-stream').send(packages)
})
CydiaRouter.route(['/Packages.gz', '/./Packages.gz']).get(async (req, res) => {
  const packages = await getPackages('gz')
  return res.contentType('application/octet-stream').send(packages)
})
CydiaRouter.route(['/Packages.bz2', '/./Packages.bz2']).get(
  async (req, res) => {
    const packages = await getPackages('bz2')
    return res.contentType('application/octet-stream').send(packages)
  }
)

export default CydiaRouter
