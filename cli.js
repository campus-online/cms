window = global
roundtrip = require('./packages/netlify-cms-widget-markdown/dist/netlify-cms-widget-markdown').default
fs = require('fs')
path = require('path')

const directory = process.argv[2]

if (!directory) throw new Error(`
  missing required argument: directory
`.trim())

if (!fs.statSync(directory).isDirectory()) throw new Error(`
  argument must point to a directory.
  "${directory}" is not a directory.
`.trim())

const listFiles = directory => {
  const list = []

  fs.readdirSync(directory).forEach(basename => {
    const filename = path.join(directory, basename)
    const isDirectory = fs.statSync(filename).isDirectory()
    const entries = isDirectory ? listFiles(filename) : [filename]
    list.push(...entries)
  })

  return list
}

listFiles(directory)
  .filter(filename => filename.endsWith('.md'))
  .forEach(filename => {
    process.stdout.write(`\nprocessing: ${path.basename(filename)}`)
    fs.writeFileSync(
      filename,
      roundtrip(fs.readFileSync(filename, 'utf8'))
    )
  })

process.stdout.write('\n-> DONE\n')
