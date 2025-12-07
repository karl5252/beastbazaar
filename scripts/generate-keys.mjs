import crypto from 'node:crypto'

function genKey() {
    return 'SA-' + crypto.randomBytes(6).toString('hex').toUpperCase()
}

function sha256(x) {
    return crypto.createHash('sha256').update(x).digest('hex')
}

const N = Number(process.argv[2] || 5)
const keys = []
const hashes = []
for (let i = 0; i < N; i++) {
    const k = genKey()
    keys.push(k)
    hashes.push(sha256(k))
}

console.log('PLAIN KEYS (give these to testers/streamers):\n' + keys.join('\n'))
console.log(
    '\nHASHES (paste into Netlify ENV GAME_KEYS_HASHES as JSON):\n' + JSON.stringify(hashes)
)
