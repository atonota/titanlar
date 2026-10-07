import { test, expect } from '@playwright/test'

const widths = [320, 360, 375, 390, 639, 640, 641, 768, 1023, 1024, 1025, 1280]

for (const route of ['/', '/izometrik/', '/v3/', '/v4/']) {
  test(`${route} retains readable text and reachable navigation`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 568 })
    const failures = []
    page.on('pageerror', (error) => failures.push(error.message))
    const response = await page.goto(`/titanlar${route}`)
    expect(response.status()).toBe(200)
    await expect(page.locator('body')).toContainText(route.startsWith('/v') ? 'Titanlar' : 'MARKA')
    await page.evaluate(() => document.fonts.ready)

    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 600 ? 568 : 800 })
      await expect.poll(() => page.evaluate(() => {
        const root = document.documentElement
        return root.scrollWidth - root.clientWidth
      })).toBeLessThanOrEqual(1).catch(async (error) => {
        console.log('Overflow evidence', width, await page.evaluate(() => Array.from(document.querySelectorAll('body *'))
          .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth &&
            element.getBoundingClientRect().width > 0)
          .slice(0, 30).map((element) => ({
            tag: element.tagName, class: element.className, id: element.id,
            right: element.getBoundingClientRect().right,
            width: element.clientWidth, scroll: element.scrollWidth,
          }))))
        throw error
      })
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
    await page.goto(`/titanlar${route}`)
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
  await page.goto('/titanlar/v4/')
  const carousel = page.getByRole('region', { name: 'Başarı hikayeleri; yatay kaydırın' })
  await carousel.focus()
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => carousel.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
})

test('/v3/ reduced motion preserves all three story steps and entered text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/titanlar/v3/')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const name of ['Analiz & Tani', 'Strateji & Yol Haritasi', 'Uygulama & Sonuc']) {
    const heading = page.getByRole('heading', { name, exact: true })
    await heading.scrollIntoViewIfNeeded()
    const box = await heading.boundingBox()
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(320)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height).toBeLessThanOrEqual(568)
  }
  await expect(page.locator('#sn1, #sn2, #sn3, #sn4')).toHaveText(['500+', '14 Yil', '%94', 'NPS 82'])
  expect(await page.locator('.slide').evaluateAll((elements) => elements.map((element) => element.scrollWidth - element.clientWidth)))
    .toEqual([0, 0, 0])
  const input = page.getByPlaceholder('E-posta adresin...', { exact: true })
  await input.fill('regression@example.test')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 720, height: 360 })
  await expect(input).toHaveValue('regression@example.test')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(input).toHaveValue('regression@example.test')
})

test('/v4/ reduced motion preserves natural scrolling and filter completion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/titanlar/v4/')
  await expect(page.locator('#sn1, #sn2, #sn3, #sn4')).toHaveText(['500+', '14 Yil', '%94', 'NPS 82'])
  expect(await page.evaluate(() => document.scrollingElement.scrollHeight)).toBeGreaterThan(568)
  await page.keyboard.press('PageDown')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Strateji', exact: true }).click()
  await expect(page.locator('.card-grid > [data-cat]:visible')).toHaveCount(2)
  await page.getByRole('button', { name: 'Tumunu Goster', exact: true }).click()
  await expect(page.locator('.card-grid > [data-cat]:visible')).toHaveCount(6)
})

test('/v4/ decorative click particles follow the motion preference', async ({ page }) => {
  await page.goto('/titanlar/v4/')
  const input = page.getByPlaceholder('E-posta adresin...', { exact: true })
  await input.click()
  await expect(page.locator('.phys-pt')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await input.click()
  await expect.poll(() => page.locator('.phys-pt').count()).toBeGreaterThan(0)
})

test.describe('touch and keyboard together', () => {
  test.use({ hasTouch: true, viewport: { width: 320, height: 568 } })
  for (const route of ['/v3/', '/v4/']) {
    test(`${route} retains standalone hit areas`, async ({ page }) => {
      await page.goto(`/titanlar${route}`)
      console.log('Input capability evidence', route, await page.evaluate(() => ({
        viewport: { width: innerWidth, height: innerHeight },
        maxTouchPoints: navigator.maxTouchPoints,
        pointerCoarse: matchMedia('(pointer: coarse)').matches,
        anyPointerCoarse: matchMedia('(any-pointer: coarse)').matches,
        hover: matchMedia('(hover: hover)').matches,
        anyHover: matchMedia('(any-hover: hover)').matches,
      })))
      const controls = await page.locator('.btn, .soc, .socs a').evaluateAll((elements) => {
        const minimum = matchMedia('(any-pointer: coarse)').matches ? 48 : 44
        return elements.filter((element) => element.getBoundingClientRect().width > 0).map((element) => ({
          label: element.textContent.trim(),
          className: element.className,
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
          minimum,
        }))
      })
      for (const control of controls) {
        expect(control.width, `${control.className}: ${control.label}`).toBeGreaterThanOrEqual(control.minimum)
        expect(control.height, `${control.className}: ${control.label}`).toBeGreaterThanOrEqual(control.minimum)
      }
      const input = page.getByPlaceholder('E-posta adresin...', { exact: true })
      await input.tap()
      await input.press('Tab')
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)).toBe('solid')
    })
  }
})


test('/v4/ reduced motion keeps hover and dragging decoration still', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/titanlar/v4/')
  const stat = page.locator('.stat-c').first()
  await stat.hover()
  await expect(stat.locator('.stat-n')).toHaveCSS('transform', 'none')
  await page.locator('#nav [data-scramble]').first().hover()
  await expect(page.locator('#nav [data-scramble]').first()).toHaveText('Hizmetler')
  await expect(stat.locator('.stat-n')).toHaveCSS('transform', 'none')
  const carousel = page.locator('.tcarousel')
  await carousel.scrollIntoViewIfNeeded()
  const box = await carousel.boundingBox()
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5, { steps: 5 })
  await expect(page.locator('.ttrack')).toHaveCSS('transform', 'none')
  await page.mouse.up()
  await expect(page.locator('.ttrack')).toHaveCSS('transform', 'none')
})
