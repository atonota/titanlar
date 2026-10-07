// Shared semantic minimum for CSS, inline Mantine text and canvas labels.
window.archiveMinimumFont = Number.parseFloat(
  getComputedStyle(document.documentElement).fontSize,
)
const archiveMotionQuery = matchMedia('(prefers-reduced-motion: reduce)')

function settleArchiveMotion() {
  if (!archiveMotionQuery.matches || !window.gsap) return

  window.ScrollSmoother?.get()?.kill()
  window.ScrollTrigger?.getAll().forEach((trigger) => {
    trigger.animation?.progress(1)
    trigger.kill()
  })
  window.gsap.globalTimeline.getChildren(true, true, false).forEach((tween) => {
    tween.repeat(0).progress(1)
  })
  window.gsap.globalTimeline.pause()
}

addEventListener('DOMContentLoaded', settleArchiveMotion, { once: true })
archiveMotionQuery.addEventListener('change', () => {
  if (archiveMotionQuery.matches) settleArchiveMotion()
  else window.gsap?.globalTimeline.play()
})
