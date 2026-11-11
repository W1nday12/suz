import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

await mkdir('public/icons', { recursive: true })

const icon = 'public/icons/icon.svg'
const favicon = 'public/favicon.svg'

await sharp(icon).resize(192, 192).png().toFile('public/icons/icon-192.png')
await sharp(icon).resize(512, 512).png().toFile('public/icons/icon-512.png')
await sharp(favicon).resize(180, 180).png().toFile('public/apple-touch-icon.png')
await sharp(favicon).resize(32, 32).png().toFile('public/favicon-32.png')

// Maskable: full-bleed background, artwork inside the 80% safe zone.
const inner = await sharp(icon).resize(400, 400).png().toBuffer()
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#0B5641' },
})
  .composite([{ input: inner, top: 56, left: 56 }])
  .png()
  .toFile('public/icons/icon-maskable-512.png')

console.log('Icons generated')
