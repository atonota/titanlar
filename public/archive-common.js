// Shared by the recovered HTML documents and their compiled canvas labels.
window.archiveMinimumFont = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
const archiveMotionQuery = matchMedia('(prefers-reduced-motion: reduce)')
const archiveLoops = new Set()
const archiveFrames = new Map()
let archiveAnimationState = null

window.archiveFrame = (callback) => {
  archiveLoops.add(callback)
  if (archiveMotionQuery.matches || archiveFrames.has(callback)) return
  archiveFrames.set(callback, requestAnimationFrame((time) => {
    archiveFrames.delete(callback)
    callback(time)
  }))
}

function applyArchiveMotion() {
  if (archiveMotionQuery.matches) {
    archiveFrames.forEach((frame) => cancelAnimationFrame(frame))
    archiveFrames.clear()
    if (!window.gsap || archiveAnimationState) return
    const triggers = window.ScrollTrigger?.getAll() ?? []
    const tweens = window.gsap.globalTimeline.getChildren(true, true, false)
    archiveAnimationState = {
      triggers,
      tweens: tweens.map((tween) => ({ tween, progress: tween.progress(), paused: tween.paused() })),
    }
    triggers.forEach((trigger) => trigger.disable(true))
    tweens.forEach((tween) => tween.progress(1).pause())
  } else {
    if (archiveAnimationState) {
      archiveAnimationState.tweens.forEach(({ tween, progress, paused }) => {
        tween.progress(progress)
        if (!paused) tween.resume()
      })
      archiveAnimationState.triggers.forEach((trigger) => trigger.enable())
      window.ScrollTrigger?.refresh()
      archiveAnimationState = null
    }
    archiveLoops.forEach(window.archiveFrame)
  }
}

addEventListener('DOMContentLoaded', applyArchiveMotion, { once: true })
archiveMotionQuery.addEventListener('change', applyArchiveMotion)
