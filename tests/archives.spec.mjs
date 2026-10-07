import { test, expect } from '@playwright/test'

const widths = [320, 360, 375, 390, 639, 640, 641, 768, 1023, 1024, 1025, 1280]

for (const route of ['/', '/izometrik/', '/v3/', '/v4/']) {
  test(`${route} retains readable text and reachable navigation`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 568 })
    const failures = []
    page.on('pageerror', (error) => failures.push(error.message))
    const response = await page.goto(route)
    expect(response.status()).toBe(200)
    await expect(page.locator('body')).toContainText(route.startsWith('/v') ? 'Titanlar' : 'MARKA')
    await page.evaluate(() => document.fonts.ready)

    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 600 ? 568 : 800 })
      await expect.poll(() => page.evaluate(() => {
        const root = document.documentElement
        return root.scrollWidth - root.clientWidth
      })).toBeLessThanOrEqual(1)
      const small = await page.evaluate(() => {
        const minimum = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
        return Array.from(document.querySelectorAll('body *')).filter((element) => {
          const hasText = Array.from(element.childNodes).some((node) =>
            node.nodeType === 3 && node.textContent.trim())
          return hasText && element.getBoundingClientRect().width > 0 &&
            Number.parseFloat(getComputedStyle(element).fontSize) < minimum
        }).map((element) => element.textContent.slice(0, 60))
      })
      expect(small, `small text at ${width}px`).toEqual([])
      const nav = page.locator('nav').first()
      expect(await nav.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
    }

    await page.setViewportSize({ width: 320, height: 568 })
    await page.screenshot({ path: testInfo.outputPath('mobile.png'), animations: 'disabled' })
    await testInfo.attach('mobile', { path: testInfo.outputPath('mobile.png'), contentType: 'image/png' })
    expect(failures).toEqual([])
  })
}

for (const route of ['/v3/', '/v4/']) {
  test(`${route} exposes keyboard focus without framing its parent`, async ({ page }) => {
    await page.goto(route)
    const input = page.getByPlaceholder('E-posta adresin...', { exact: true })
    await input.click()
    await input.press('Tab')
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)).toBe('solid')
    expect(await page.evaluate(() => getComputedStyle(document.activeElement.parentElement).outlineStyle)).toBe('none')
    await page.keyboard.press('Shift+Tab')
    await expect(input).toBeFocused()
    expect(await input.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
  })
}

test('/v4/ testimonials support keyboard scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/v4/')
  const carousel = page.getByRole('region', { name: 'Başarı hikayeleri; yatay kaydırın' })
  await carousel.focus()
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => carousel.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
})
