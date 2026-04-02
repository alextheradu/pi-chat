import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'

rmSync('tsconfig.tsbuildinfo', { force: true })

execFileSync('npx', ['next', 'typegen'], { stdio: 'inherit' })

for (const dir of ['.next/types', '.next/dev/types']) {
  mkdirSync(dir, { recursive: true })
  writeFileSync(`${dir}/cache-life.d.ts`, 'export {}\n')
}

execFileSync('npx', ['tsc', '--noEmit', '--incremental', 'false'], {
  stdio: 'inherit',
})
