import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(process.cwd(), 'public/icons')

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#0c0c0e"/>
  <text x="50" y="72" font-family="serif" font-size="72" fill="#f5c518" text-anchor="middle">π</text>
</svg>`

async function main() {
  for (const size of sizes) {
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(iconsDir, `icon-${size}.png`))
    console.log(`Generated icon-${size}.png`)
  }
}

main().catch(console.error)
