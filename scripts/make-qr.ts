import QRCode from 'qrcode'
import { writeFileSync } from 'node:fs'

const targets = process.argv[2]
  ? [{ url: process.argv[2], out: process.argv[3] ?? 'C:/Users/nikae/Downloads/suz-qr.png' }]
  : [
      {
        url: 'https://w1nday12.github.io/suz/',
        out: 'C:/Users/nikae/Downloads/suz-web-qr.png',
      },
      {
        url: 'https://github.com/W1nday12/suz/releases/download/v1.0.0/suz-app-release.apk',
        out: 'C:/Users/nikae/Downloads/suz-apk-qr.png',
      },
    ]

for (const { url, out } of targets) {
  const dataUrl = await QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: { dark: '#0e6b4f', light: '#fbf6ea' },
  })
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  writeFileSync(out, Buffer.from(base64, 'base64'))
  console.log(`QR saved: ${out} -> ${url}`)
}
