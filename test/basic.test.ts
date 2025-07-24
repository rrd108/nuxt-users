import { fileURLToPath } from 'node:url'
import { describe, it, expect, afterEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import path from 'node:path'
import fs from 'node:fs'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  afterEach(async () => {
    // remove the test db file
    await fs.promises.unlink(path.join(process.cwd(), '_basic-test'))
  })

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/')
    expect(html).toContain('<div>basic</div>')
  })
})
