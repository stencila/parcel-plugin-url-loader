const path = require('path')
const CSSAsset = require(`parcel-bundler/${parseInt(process.versions.node, 10) < 8 ? 'lib' : 'src'}/assets/CSSAsset`)
const { base64, read } = require('../utils')
const { getOptions } = require('../config')
const collection = require('../collection')

module.exports = class extends CSSAsset {
  constructor(name, options) {
    super(name, options)
  }

  async postProcess (generated) {
    const css = generated.find(e => e.type === 'css')
    if (css && process.env.NODE_ENV === 'production') {
      const { exts, limit } = await getOptions()
      for (let i of this.dependencies) {
        const [key, val] = i
        const { name, resolved } = val
        const basename = path.basename(name)
        const extname = path.extname(basename).replace('.', '')
        if (exts.includes(extname)) {
          const file = await read(resolved, 'binary')
          if (file.length <= limit) {
            let relativePath
            if (resolved) {
              const _assetPath = path.parse(
                path.relative("src/themes", resolved)
              )
              relativePath = path.join(
                _assetPath.dir,
                _assetPath.name
              )
            }

            const hashname = this.generateBundleName.call({
              relativeName: (relativePath || basename) + '.' + extname,
              type: extname
            })
            const regexp = new RegExp(hashname, 'g')
            collection.set(hashname, { basename, path: resolved })
            const base64str = await base64(file, basename)
            css.value = css.value.replace(regexp, base64str)
          }
        }
      }
    }
    return generated
  }
}
