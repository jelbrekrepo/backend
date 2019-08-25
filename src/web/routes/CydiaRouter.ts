import express from 'express'
import { stripIndents } from 'common-tags'
import { repoInformation } from '../../util/CydiaUtil'

const CydiaRouter = express.Router()
CydiaRouter.route('/Release').get((req, res) => {
  const info = repoInformation()
  res.send(stripIndents`Origin: ${info.Origin}
  Label: ${info.Label}
  Suite: ${info.Suite}
  Version: ${info.Version}
  Codename: ${info.Codename}
  Architectures: ${info.Architectures}
  Components: ${info.Components}
  Description: ${info.Description}`)
})

CydiaRouter.route('/Packages')

export default CydiaRouter
