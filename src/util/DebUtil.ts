import DebPackage from './DebPackage'
import decompress from 'decompress'
import ar, { ARFile } from 'ar'

export async function getControl(file: Buffer): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let archive = new ar.Archive(file)
    let files = archive.getFiles()
    let controlFile
    await Promise.all(
      files.map(async (file: ARFile) => {
        let name = file.name()
        if (name === 'control.tar.gz') {
          let cFiles = await decompress(file.fileData())
          cFiles.forEach(cFile => {
            if (cFile.path.endsWith('control')) {
              controlFile = cFile.data.toString()
            }
          })
        }
      })
    )
    if (!controlFile) {
      reject(new Error('Could not find control file!'))
    }
    resolve(controlFile)
  })
}

export async function getDebPackage(file: Buffer): Promise<DebPackage> {
  let control = await getControl(file)
  let debPkg = new DebPackage(control)
  return debPkg
}
