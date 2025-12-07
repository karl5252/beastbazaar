// scripts/version-bump.mjs
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const root = process.cwd()
const metaPath = path.join(root, 'build.meta.json')
const outPath = path.join(root, 'src/game/config/buildInfo.json')
const envOut = path.join(root, '.env.local')
const pkgPath = path.join(root, 'package.json')

/* --------- flags --------- */
const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const getArg = (k, def = null) => {
    const a = argv.find(x => x.startsWith(`${k}=`))
    return a ? a.split('=')[1] : def
}
const bumpKind = has('--major') ? 'major' : has('--minor') ? 'minor' : has('--patch') ? 'patch' : null
const format = getArg('--format', process.env.VITE_VERSION_FORMAT || 'semver+build')
// dozwolone: semver, uuid, semver+build

const bumpSemver = (v, which = 'patch') => {
    const m = String(v || '0.1.0').match(/^(\d+)\.(\d+)\.(\d+)(?:[+-].*)?$/)
    let [maj, min, pat] = m ? [+m[1], +m[2], +m[3]] : [0, 1, 0]
    if (which === 'major') {
        maj++;
        min = 0;
        pat = 0
    } else if (which === 'minor') {
        min++;
        pat = 0
    } else {
        pat++
    }
    return `${maj}.${min}.${pat}`
}

/* --------- build counter --------- */
const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {build: 0}
meta.build = (meta.build | 0) + 1
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))

/* --------- semver (opcjonalny bump) --------- */
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
let semver = pkg.version || '0.1.0'
if (bumpKind) {
    semver = bumpSemver(semver, bumpKind)
    pkg.version = semver
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

/* --------- compose version string --------- */
const uuid = crypto.randomUUID?.() ?? crypto.randomBytes(16).toString('hex')
let version
if (format === 'uuid') {
    version = uuid
} else if (format === 'semver') {
    version = semver
} else { // 'semver+build' default
    version = `${semver}+B${meta.build}`
}

/* --------- outputs --------- */
fs.mkdirSync(path.dirname(outPath), {recursive: true})
fs.writeFileSync(
    outPath,
    JSON.stringify({version, semver, build: meta.build, uuid, timestamp: Date.now()}, null, 2)
)

fs.writeFileSync(
    envOut,
    `VITE_APP_VERSION=${version}\nVITE_BUILD_NUMBER=${meta.build}\nVITE_VERSION_UUID=${uuid}\n`
)

console.log(`[version-bump] ${version} (build ${meta.build})`)
