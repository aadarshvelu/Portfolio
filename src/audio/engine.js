// Minimal synthesized audio — just two sounds, generated with the Web Audio API
// (no files, off-thread, near-zero cost):
//   • tick() — a short iOS-picker "tock" per detent scrolling the reel.
//   • woff() — a soft air-puff on each polaroid pan in The Upgrade.
// Master is 0.5, so the OS scales it by the system volume → we play at half the
// system level.

class AudioEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.noise = null
    this.vol = 0.5
    this.lastTick = -1
    this.lastWoff = -1
    this.lastBurst = -1
    let muted = false
    try { muted = localStorage.getItem('walkthrough_muted') === '1' } catch (e) { /* private mode */ }
    this.muted = muted
  }

  get ready() { return !!this.ctx }

  // Create/resume the AudioContext. MUST be called from a user gesture the first
  // time (browsers block audio until then).
  unlock() {
    if (this.ctx) { if (this.ctx.resume) this.ctx.resume(); return }
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    this.ctx = ctx
    const master = ctx.createGain()
    master.gain.value = this.muted ? 0 : this.vol
    master.connect(ctx.destination)
    this.master = master
    this.noise = this._noiseBuffer(1)
    if (ctx.resume) ctx.resume()
  }

  _noiseBuffer(seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    return buf
  }

  // short "tock" — a bandpassed noise transient + a hint of pitched body.
  tick() {
    if (!this.ctx) return
    const ctx = this.ctx, now = ctx.currentTime
    if (now - this.lastTick < 0.04) return
    this.lastTick = now
    const src = ctx.createBufferSource(); src.buffer = this.noise
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 1.3
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.28, now + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
    src.connect(bp).connect(g).connect(this.master)
    src.start(now); src.stop(now + 0.06)
    const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 880
    const og = ctx.createGain()
    og.gain.setValueAtTime(0.0001, now)
    og.gain.exponentialRampToValueAtTime(0.1, now + 0.002)
    og.gain.exponentialRampToValueAtTime(0.0001, now + 0.045)
    osc.connect(og).connect(this.master)
    osc.start(now); osc.stop(now + 0.06)
  }

  // confetti-cone POP — a punchy low-mid thump + a bright airy spray tail.
  burst() {
    if (!this.ctx) return
    const ctx = this.ctx, now = ctx.currentTime
    if (now - this.lastBurst < 0.15) return
    this.lastBurst = now
    const pop = ctx.createBufferSource(); pop.buffer = this.noise
    const plp = ctx.createBiquadFilter(); plp.type = 'lowpass'; plp.frequency.value = 900
    const pg = ctx.createGain()
    pg.gain.setValueAtTime(0.0001, now)
    pg.gain.exponentialRampToValueAtTime(0.5, now + 0.006)
    pg.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    pop.connect(plp).connect(pg).connect(this.master)
    pop.start(now); pop.stop(now + 0.14)
    const spray = ctx.createBufferSource(); spray.buffer = this.noise
    const shp = ctx.createBiquadFilter(); shp.type = 'highpass'; shp.frequency.value = 3200
    const sg = ctx.createGain()
    sg.gain.setValueAtTime(0.0001, now + 0.005)
    sg.gain.exponentialRampToValueAtTime(0.26, now + 0.03)
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)
    spray.connect(shp).connect(sg).connect(this.master)
    spray.start(now); spray.stop(now + 0.34)
  }

  // soft "woff" air-puff — lowpass-swept noise.
  woff() {
    if (!this.ctx) return
    const ctx = this.ctx, now = ctx.currentTime
    if (now - this.lastWoff < 0.1) return
    this.lastWoff = now
    const src = ctx.createBufferSource(); src.buffer = this.noise
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6
    lp.frequency.setValueAtTime(1600, now)
    lp.frequency.exponentialRampToValueAtTime(480, now + 0.26)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.36, now + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
    src.connect(lp).connect(g).connect(this.master)
    src.start(now); src.stop(now + 0.32)
  }

  setMuted(m) {
    this.muted = m
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : this.vol, this.ctx.currentTime, 0.05)
    try { localStorage.setItem('walkthrough_muted', m ? '1' : '0') } catch (e) { /* private mode */ }
  }
}

export const audio = new AudioEngine()
