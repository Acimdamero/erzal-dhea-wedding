/**
 * BeatEngine — simulated rhythmic pulse synced to estimated BPM.
 * YouTube IFrame API does not expose audio for Web Audio analysis,
 * so we use a time-based beat clock aligned to playback start.
 */
(function (global) {
  'use strict';

  const DEFAULT_BPM = 75;
  const BEATS_PER_MEASURE = 4;
  const AUTO_SCROLL_PX = 30;
  const USER_SCROLL_PAUSE_MS = 5000;

  class BeatEngine {
    constructor(options = {}) {
      this.bpm = options.bpm ?? DEFAULT_BPM;
      this.beatIntervalMs = 60000 / this.bpm;
      this.isRunning = false;
      this.beatCount = 0;
      this.rafId = null;
      this.lastBeatTime = 0;
      this.intensity = 0;
      this.lastUserScroll = 0;
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this._onBeat = this._onBeat.bind(this);
      this._tick = this._tick.bind(this);
      this._onUserScroll = this._onUserScroll.bind(this);

      window.addEventListener('wheel', this._onUserScroll, { passive: true });
      window.addEventListener('touchmove', this._onUserScroll, { passive: true });
      window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' '].includes(e.key)) {
          this._onUserScroll();
        }
      });
    }

    start() {
      if (this.reducedMotion || this.isRunning) return;
      this.isRunning = true;
      this.lastBeatTime = performance.now();
      this.beatCount = 0;
      document.body.classList.add('beat-active');
      this.rafId = requestAnimationFrame(this._tick);
    }

    stop() {
      this.isRunning = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      document.body.classList.remove('beat-active', 'beat-pulse', 'beat-downbeat');
      document.documentElement.style.setProperty('--beat-intensity', '0');
    }

    _onUserScroll() {
      this.lastUserScroll = Date.now();
    }

    _tick(now) {
      if (!this.isRunning) return;

      const elapsed = now - this.lastBeatTime;
      if (elapsed >= this.beatIntervalMs) {
        this.lastBeatTime = now - (elapsed % this.beatIntervalMs);
        this._onBeat();
      }

      const phase = (now - this.lastBeatTime) / this.beatIntervalMs;
      this.intensity = Math.max(0, 1 - phase);
      document.documentElement.style.setProperty(
        '--beat-intensity',
        this.reducedMotion ? '0' : String(this.intensity.toFixed(3))
      );

      this.rafId = requestAnimationFrame(this._tick);
    }

    _onBeat() {
      if (this.reducedMotion) return;

      this.beatCount += 1;
      const isDownbeat = this.beatCount % BEATS_PER_MEASURE === 1;

      document.body.classList.remove('beat-pulse', 'beat-downbeat');
      void document.body.offsetWidth;
      document.body.classList.add('beat-pulse');
      if (isDownbeat) {
        document.body.classList.add('beat-downbeat');
        this._autoScroll();
        this._burstParticles();
      }

      this._pulseOrnaments(isDownbeat);
    }

    _autoScroll() {
      const sinceUserScroll = Date.now() - this.lastUserScroll;
      if (sinceUserScroll < USER_SCROLL_PAUSE_MS) return;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= maxScroll - 50) return;

      window.scrollBy({ top: AUTO_SCROLL_PX, behavior: 'smooth' });
    }

    _pulseOrnaments(isDownbeat) {
      const ornaments = document.querySelectorAll('.ornament');
      ornaments.forEach((el, i) => {
        el.classList.remove('ornament--pulse', 'ornament--flash');
        void el.offsetWidth;
        el.classList.add('ornament--pulse');
        if (isDownbeat && i % 2 === 0) {
          el.classList.add('ornament--flash');
        }
      });
    }

    _burstParticles() {
      const container = document.getElementById('beatParticles');
      if (!container) return;

      const types = ['star', 'petal', 'heart'];
      for (let i = 0; i < 3; i += 1) {
        const particle = document.createElement('span');
        particle.className = `beat-particle beat-particle--${types[i % types.length]}`;
        particle.style.left = `${15 + Math.random() * 70}%`;
        particle.style.top = `${10 + Math.random() * 60}%`;
        particle.style.animationDelay = `${i * 0.05}s`;
        container.appendChild(particle);
        particle.addEventListener('animationend', () => particle.remove());
      }
    }
  }

  global.BeatEngine = BeatEngine;
})(window);
