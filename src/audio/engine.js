// Minimal synthesized audio — one sound, generated with the Web Audio API (no
// files, off-thread, near-zero cost):
//   • burst() — the confetti-cannon "POP" at the celebration.
// Master is 0.5, so the OS scales it by the system volume → we play at half the
// system level.

class AudioEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.noise = null
    this.vol = 0.5
    this.lastBurst = -1
    let muted = false
    try { muted = localStorage.getItem('walkthrough_muted') === '1' } catch (e) { /* private mode */ }
    this.muted = muted
  }

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


  // confetti-cannon BURST — four layers for a real party-popper "POP", not a
  // thin spark: (1) a punchy pitched body, (2) a sharp broadband snap, (3) an
  // airy spray that sweeps down, (4) a scatter of tiny crackles (the confetti
  // pieces). Each noise source reads from a random offset so it never phases.
  burst() {
    if (!this.ctx) return
    const ctx = this.ctx, now = ctx.currentTime
    if (now - this.lastBurst < 0.15) return
    this.lastBurst = now
    const master = this.master
    const rndOff = () => Math.random() * 0.9 // random start into the 1s noise buffer

    // 1) Body — a punchy pitched thump (240 → 65 Hz) that gives the pop weight.
    const body = ctx.createOscillator()
    body.type = 'sine'
    body.frequency.setValueAtTime(240, now)
    body.frequency.exponentialRampToValueAtTime(65, now + 0.09)
    const bg = ctx.createGain()
    bg.gain.setValueAtTime(0.0001, now)
    bg.gain.exponentialRampToValueAtTime(0.55, now + 0.005)
    bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    body.connect(bg).connect(master)
    body.start(now); body.stop(now + 0.2)

    // 2) Snap — a very short broadband transient for the "crack".
    const snap = ctx.createBufferSource(); snap.buffer = this.noise
    const sbp = ctx.createBiquadFilter(); sbp.type = 'bandpass'; sbp.frequency.value = 1900; sbp.Q.value = 0.6
    const spg = ctx.createGain()
    spg.gain.setValueAtTime(0.5, now)
    spg.gain.exponentialRampToValueAtTime(0.0001, now + 0.03)
    snap.connect(sbp).connect(spg).connect(master)
    snap.start(now, rndOff()); snap.stop(now + 0.04)

    // 3) Spray — airy noise with a downward-sweeping lowpass (confetti whoosh).
    const spray = ctx.createBufferSource(); spray.buffer = this.noise
    const slp = ctx.createBiquadFilter(); slp.type = 'lowpass'
    slp.frequency.setValueAtTime(5200, now + 0.01)
    slp.frequency.exponentialRampToValueAtTime(750, now + 0.35)
    const sg = ctx.createGain()
    sg.gain.setValueAtTime(0.0001, now + 0.004)
    sg.gain.exponentialRampToValueAtTime(0.28, now + 0.02)
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
    spray.connect(slp).connect(sg).connect(master)
    spray.start(now, rndOff()); spray.stop(now + 0.42)

    // 4) Crackle — a scatter of tiny bandpassed pops (confetti pieces flying).
    for (let k = 0; k < 8; k++) {
      const t = now + 0.015 + Math.random() * 0.34
      const cr = ctx.createBufferSource(); cr.buffer = this.noise
      const crf = ctx.createBiquadFilter(); crf.type = 'bandpass'
      crf.frequency.value = 1800 + Math.random() * 3800
      crf.Q.value = 2.5
      const crg = ctx.createGain()
      const amp = 0.05 + Math.random() * 0.09
      crg.gain.setValueAtTime(0.0001, t)
      crg.gain.exponentialRampToValueAtTime(amp, t + 0.003)
      crg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
      cr.connect(crf).connect(crg).connect(master)
      cr.start(t, rndOff()); cr.stop(t + 0.06)
    }
  }

  setMuted(m) {
    this.muted = m
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : this.vol, this.ctx.currentTime, 0.05)
    try { localStorage.setItem('walkthrough_muted', m ? '1' : '0') } catch (e) { /* private mode */ }
  }
}

export const audio = new AudioEngine()
