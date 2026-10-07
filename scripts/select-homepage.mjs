import { copyFile } from 'node:fs/promises'

// Publish the user-selected historical snapshot as the homepage.
// Vite also copies the same snapshot to /izometrik/.
await copyFile(
  new URL('../public/izometrik/index.html', import.meta.url),
  new URL('../dist/index.html', import.meta.url),
)
