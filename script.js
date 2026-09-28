/**
 * AuraWeather AR - Camera-First Weather Experience
 * The webcam feed is the primary background.
 * Dynamic weather animations are rendered directly over the live camera feed
 * as an Augmented Reality (AR) filter without obscuring the user.
 */

// ==========================================
// Weather Configurations
// ==========================================
const WEATHER_MODES = {
  sun: {
    title: "Golden Sun",
    badge: "1 Finger ☝️",
    icon: "☀️",
    accent: "#f59e0b",
    tintRgba: "rgba(245, 158, 11, 0.08)" // very gentle warm ambient wash
  },
  rain: {
    title: "Rain Storm",
    badge: "2 Fingers ✌️",
    icon: "🌧️",
    accent: "#38bdf8",
    tintRgba: "rgba(14, 165, 233, 0.08)"
  },
  snow: {
    title: "Crystal Snow",
    badge: "3 Fingers 🤟",
    icon: "❄️",
    accent: "#7dd3fc",
    tintRgba: "rgba(186, 230, 253, 0.06)"
  },
  star: {
    title: "Cosmic Stars",
    badge: "4 Fingers 🖖",
    icon: "✨",
    accent: "#c084fc",
    tintRgba: "rgba(147, 51, 234, 0.08)"
  },
  meteorites: {
    title: "Meteor Shower",
    badge: "5 Fingers 🖐️",
    icon: "☄️",
    accent: "#ff4500",
    tintRgba: "rgba(255, 69, 0, 0.08)"
  },
  idle: {
    title: "Waiting for Gesture",
    badge: "0 Fingers ✊",
    icon: "⛅",
    accent: "#94a3b8",
    tintRgba: "rgba(0, 0, 0, 0)"
  }
};

// ==========================================
// Application State
// ==========================================
const state = {
  currentWeather: "sun",
  isCameraMirrored: true,
  showSkeleton: true,
  isSoundOn: false,
  fingerCount: 1,
  handLandmarks: null,
  cameraReady: false
};

// ==========================================
// DOM Elements
// ==========================================
const canvas = document.getElementById("ar-canvas");
const ctx = canvas.getContext("2d");
const video = document.getElementById("webcam-video");
const cameraLoader = document.getElementById("camera-loader");
const loaderTitle = document.getElementById("loader-title");
const loaderSub = document.getElementById("loader-sub");
const enableCamBtn = document.getElementById("enable-cam-btn");
const lightningFlash = document.getElementById("lightning-flash");

const statusGesture = document.getElementById("status-gesture");
const statusWeather = document.getElementById("status-weather");
const soundBtn = document.getElementById("sound-btn");
const soundIcon = document.getElementById("sound-icon");
const flipBtn = document.getElementById("flip-btn");
const skeletonBtn = document.getElementById("skeleton-btn");
const dockBtns = document.querySelectorAll(".dock-btn");
const toastBox = document.getElementById("toast-box");

// Toast helper
function showToast(msg, icon = "✨") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  toastBox.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast-show"));
  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.remove(), 350);
  }, 2800);
}

// ==========================================
// Procedural Web Audio Engine (Zero Assets)
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.nodes = [];
    this.isMuted = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  stop() {
    this.nodes.forEach(n => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch (e) {}
    });
    this.nodes = [];
  }

  setWeather(w) {
    if (this.isMuted) return;
    this.init();
    this.stop();
    switch (w) {
      case "sun": this.playSun(); break;
      case "rain": this.playRain(); break;
      case "snow": this.playSnow(); break;
      case "star": this.playStar(); break;
      case "meteorites": this.playMeteors(); break;
    }
  }

  createNoise() {
    if (!this.ctx) return null;
    const len = this.ctx.sampleRate * 2;
    const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      d[i] = (last + 0.02 * w) / 1.02;
      last = d[i];
      d[i] *= 3;
    }
    return b;
  }

  playSun() {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(261.63, this.ctx.currentTime);
    g.gain.setValueAtTime(0.001, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 1.5);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    this.nodes.push(osc, g);
  }

  playRain() {
    const b = this.createNoise();
    if (!b) return;
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(750, this.ctx.currentTime);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 1.2);
    src.connect(f);
    f.connect(g);
    g.connect(this.ctx.destination);
    src.start();
    this.nodes.push(src, g);
  }

  playThunder() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(75, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 1.6);
      g.gain.setValueAtTime(0.25, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.9);
    } catch (e) {}
  }

  playSnow() {
    const b = this.createNoise();
    if (!b) return;
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(600, this.ctx.currentTime);
    f.Q.setValueAtTime(3.5, this.ctx.currentTime);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.07, this.ctx.currentTime + 1.5);
    src.connect(f);
    f.connect(g);
    g.connect(this.ctx.destination);
    src.start();
    this.nodes.push(src, g);
  }

  playStar() {
    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o1.type = "sine";
    o1.frequency.setValueAtTime(146.83, this.ctx.currentTime);
    o2.type = "sine";
    o2.frequency.setValueAtTime(220.00, this.ctx.currentTime);
    g.gain.setValueAtTime(0.001, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 2.0);
    o1.connect(g);
    o2.connect(g);
    g.connect(this.ctx.destination);
    o1.start();
    o2.start();
    this.nodes.push(o1, o2, g);
  }

  playMeteors() {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(55, this.ctx.currentTime);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(180, this.ctx.currentTime);
    g.gain.setValueAtTime(0.001, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 1.2);
    osc.connect(f);
    f.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    this.nodes.push(osc, g);
  }

  toggle() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) this.stop();
    else this.setWeather(state.currentWeather);
    return !this.isMuted;
  }
}
const audio = new SoundEngine();

// ==========================================
// AR Weather Particle Engine (Overlaid on Camera)
// ==========================================
class ARWeatherFilter {
  constructor(c, context) {
    this.canvas = c;
    this.ctx = context;
    this.w = window.innerWidth;
    this.h = window.innerHeight;

    // Entity stores
    this.raindrops = [];
    this.lensDroplets = [];
    this.splashes = [];
    this.snowflakes = [];
    this.stars = [];
    this.meteors = [];
    this.meteorSparks = [];
    this.sunMotes = [];

    // Animation variables
    this.sunRaysAngle = 0;
    this.nextLightningTime = performance.now() + 4500;
    this.nextMeteorTime = performance.now() + 300;

    this.init();
  }

  resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.init();
  }

  init() {
    // Rain streaks (semi-transparent)
    this.raindrops = [];
    for (let i = 0; i < 280; i++) {
      this.raindrops.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        len: 18 + Math.random() * 26,
        speed: 16 + Math.random() * 12,
        alpha: 0.35 + Math.random() * 0.35
      });
    }

    // Raindrops sticking on camera glass lens
    this.lensDroplets = [];
    for (let i = 0; i < 35; i++) {
      this.lensDroplets.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r: 3 + Math.random() * 8,
        vy: 0.15 + Math.random() * 0.4,
        alpha: 0.25 + Math.random() * 0.35
      });
    }

    // Snowflakes (multi-depth 3D drift)
    this.snowflakes = [];
    for (let i = 0; i < 180; i++) {
      this.snowflakes.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r: 1.5 + Math.random() * 4,
        vy: 1.0 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 0.8,
        seed: Math.random() * 100,
        swaySpeed: 0.015 + Math.random() * 0.02,
        alpha: 0.45 + Math.random() * 0.45
      });
    }

    // Twinkling stars (concentrated in upper camera area)
    this.stars = [];
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * (this.h * 0.85),
        r: 0.8 + Math.random() * 2.2,
        alpha: 0.3 + Math.random() * 0.65,
        twinkleSpeed: 0.03 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Golden sun motes
    this.sunMotes = [];
    for (let i = 0; i < 60; i++) {
      this.sunMotes.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r: 1.5 + Math.random() * 3,
        vy: -0.2 - Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.3,
        alpha: 0.25 + Math.random() * 0.45
      });
    }
  }

  // Draw Camera Feed (Cover full screen, mirrored)
  drawCameraFeed() {
    if (!video || video.readyState < 2) return;

    this.ctx.save();
    if (state.isCameraMirrored) {
      this.ctx.translate(this.w, 0);
      this.ctx.scale(-1, 1);
    }

    // Scale to cover without stretching
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;
    const vRatio = vW / vH;
    const sRatio = this.w / this.h;

    let dW, dH, dx, dy;
    if (sRatio > vRatio) {
      dW = this.w;
      dH = this.w / vRatio;
      dx = 0;
      dy = (this.h - dH) / 2;
    } else {
      dH = this.h;
      dW = this.h * vRatio;
      dx = (this.w - dW) / 2;
      dy = 0;
    }

    this.ctx.drawImage(video, dx, dy, dW, dH);
    this.ctx.restore();

    // Subtle atmospheric tint (preserves user face completely)
    const mode = WEATHER_MODES[state.currentWeather];
    if (mode && mode.tintRgba) {
      this.ctx.fillStyle = mode.tintRgba;
      this.ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  // 1. Sun Overlay (AR sun in top corner, lens flare, glowing sunbeams)
  drawSunOverlay(t) {
    const sunX = this.w - 110;
    const sunY = 110;
    this.sunRaysAngle += 0.003;
    const pulse = Math.sin(t * 0.0025) * 6;

    this.ctx.save();
    this.ctx.globalCompositeOperation = "screen";

    // Sun Corona Glow
    const corona = this.ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 180 + pulse);
    corona.addColorStop(0, "rgba(255, 240, 160, 0.85)");
    corona.addColorStop(0.3, "rgba(255, 170, 0, 0.35)");
    corona.addColorStop(0.7, "rgba(255, 120, 0, 0.12)");
    corona.addColorStop(1, "rgba(255, 80, 0, 0)");
    this.ctx.fillStyle = corona;
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, 180 + pulse, 0, Math.PI * 2);
    this.ctx.fill();

    // Rotating Sunbeams
    this.ctx.save();
    this.ctx.translate(sunX, sunY);
    this.ctx.rotate(this.sunRaysAngle);
    for (let i = 0; i < 14; i++) {
      const angle = (i * Math.PI * 2) / 14;
      const rayLen = 280 + Math.sin(t * 0.003 + i) * 40;
      this.ctx.save();
      this.ctx.rotate(angle);
      const rGrad = this.ctx.createLinearGradient(0, 0, rayLen, 0);
      rGrad.addColorStop(0, "rgba(255, 235, 160, 0.4)");
      rGrad.addColorStop(0.6, "rgba(255, 180, 50, 0.1)");
      rGrad.addColorStop(1, "rgba(255, 150, 0, 0)");
      this.ctx.fillStyle = rGrad;
      this.ctx.beginPath();
      this.ctx.moveTo(25, -9);
      this.ctx.lineTo(rayLen, 0);
      this.ctx.lineTo(25, 9);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    }
    this.ctx.restore();

    // Core Sun Disc
    const core = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 46);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(0.6, "#fef08a");
    core.addColorStop(1, "#f59e0b");
    this.ctx.fillStyle = core;
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, 44, 0, Math.PI * 2);
    this.ctx.fill();

    // Diagonal Lens Flares
    const flares = [
      { x: sunX - 140, y: sunY + 110, r: 18, c: "rgba(255, 230, 100, 0.22)" },
      { x: sunX - 260, y: sunY + 200, r: 35, c: "rgba(255, 180, 50, 0.15)" },
      { x: sunX - 380, y: sunY + 290, r: 14, c: "rgba(56, 189, 248, 0.22)" }
    ];
    flares.forEach(f => {
      this.ctx.fillStyle = f.c;
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Golden dust motes
    this.ctx.fillStyle = "rgba(255, 235, 160, 0.55)";
    this.sunMotes.forEach(m => {
      m.y += m.vy;
      m.x += m.vx;
      if (m.y < 0) m.y = this.h;
      if (m.x < 0) m.x = this.w;
      if (m.x > this.w) m.x = 0;
      this.ctx.beginPath();
      this.ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  // 2. Rain Overlay (Rain streaks + camera glass condensation + lightning)
  drawRainOverlay(t) {
    const wind = 0.18;

    // Falling Raindrops
    this.ctx.save();
    this.ctx.strokeStyle = "rgba(186, 230, 253, 0.55)";
    this.ctx.lineWidth = 1.4;

    this.raindrops.forEach(d => {
      this.ctx.beginPath();
      this.ctx.moveTo(d.x, d.y);
      this.ctx.lineTo(d.x + Math.sin(wind) * d.len, d.y + Math.cos(wind) * d.len);
      this.ctx.stroke();

      d.y += d.speed;
      d.x += Math.sin(wind) * d.speed;

      if (d.y > this.h) {
        d.y = -d.len;
        d.x = Math.random() * this.w;
        if (Math.random() > 0.6) {
          this.splashes.push({
            x: d.x,
            y: this.h - 4,
            r: 2,
            maxR: 8 + Math.random() * 6,
            alpha: 0.6
          });
        }
      }
    });

    // Splashes at bottom
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      this.ctx.strokeStyle = `rgba(186, 230, 253, ${s.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.r, Math.PI, Math.PI * 2);
      this.ctx.stroke();
      s.r += 0.8;
      s.alpha -= 0.05;
      if (s.alpha <= 0) this.splashes.splice(i, 1);
    }
    this.ctx.restore();

    // Droplets sliding down camera lens
    this.ctx.save();
    this.lensDroplets.forEach(ld => {
      ld.y += ld.vy;
      if (ld.y > this.h + 20) {
        ld.y = -10;
        ld.x = Math.random() * this.w;
      }
      const grad = this.ctx.createRadialGradient(ld.x - ld.r * 0.2, ld.y - ld.r * 0.2, 1, ld.x, ld.y, ld.r);
      grad.addColorStop(0, `rgba(255, 255, 255, ${ld.alpha * 0.8})`);
      grad.addColorStop(0.7, `rgba(186, 230, 253, ${ld.alpha * 0.3})`);
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(ld.x, ld.y, ld.r, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();

    // Occasional subtle lightning flash
    if (t > this.nextLightningTime) {
      lightningFlash.classList.add("flash-active");
      audio.playThunder();
      setTimeout(() => lightningFlash.classList.remove("flash-active"), 120);
      if (Math.random() > 0.5) {
        setTimeout(() => {
          lightningFlash.classList.add("flash-active");
          setTimeout(() => lightningFlash.classList.remove("flash-active"), 80);
        }, 180);
      }
      this.nextLightningTime = t + 5000 + Math.random() * 8000;
    }
  }

  // 3. Snow Overlay (Fluttering 3D snowflakes around user)
  drawSnowOverlay(t) {
    this.ctx.save();
    this.snowflakes.forEach(f => {
      f.seed += f.swaySpeed;
      const sway = Math.sin(f.seed) * 1.4;
      f.y += f.vy;
      f.x += f.vx + sway;

      if (f.y > this.h) {
        f.y = -5;
        f.x = Math.random() * this.w;
      }
      if (f.x > this.w) f.x = 0;
      if (f.x < 0) f.x = this.w;

      this.ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      this.ctx.fill();

      // Soft blur halo for foreground snowflakes
      if (f.r > 2.8) {
        this.ctx.fillStyle = `rgba(186, 230, 253, 0.25)`;
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y, f.r * 2.2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Very subtle frosted border (edges only, never covering user center)
    const frost = this.ctx.createRadialGradient(
      this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.45,
      this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.75
    );
    frost.addColorStop(0, "rgba(224, 242, 254, 0)");
    frost.addColorStop(1, "rgba(186, 230, 253, 0.18)");
    this.ctx.fillStyle = frost;
    this.ctx.fillRect(0, 0, this.w, this.h);
    this.ctx.restore();
  }

  // 4. Stars & Aurora Overlay
  drawStarsOverlay(t) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "screen";

    // Wavy Aurora Borealis ribbon across the top sky
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.h * 0.15);
    for (let x = 0; x <= this.w; x += 30) {
      const y = (this.h * 0.15) +
        Math.sin(x * 0.003 + t * 0.001) * 30 +
        Math.cos(x * 0.006 - t * 0.0008) * 15;
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(this.w, 0);
    this.ctx.lineTo(0, 0);
    this.ctx.closePath();

    const aurora = this.ctx.createLinearGradient(0, 0, 0, this.h * 0.28);
    aurora.addColorStop(0, "rgba(52, 211, 153, 0.24)");
    aurora.addColorStop(0.5, "rgba(56, 189, 248, 0.15)");
    aurora.addColorStop(1, "rgba(168, 85, 247, 0)");
    this.ctx.fillStyle = aurora;
    this.ctx.fill();

    // Twinkling stars
    this.stars.forEach(s => {
      s.phase += s.twinkleSpeed;
      const alpha = s.alpha + Math.sin(s.phase) * 0.35;
      const safeAlpha = Math.max(0.1, Math.min(1.0, alpha));

      this.ctx.fillStyle = `rgba(255, 255, 255, ${safeAlpha})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      this.ctx.fill();

      // Cross flare on bright stars
      if (safeAlpha > 0.75) {
        this.ctx.strokeStyle = `rgba(224, 242, 254, ${safeAlpha * 0.8})`;
        this.ctx.lineWidth = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(s.x - s.r * 3, s.y);
        this.ctx.lineTo(s.x + s.r * 3, s.y);
        this.ctx.moveTo(s.x, s.y - s.r * 3);
        this.ctx.lineTo(s.x, s.y + s.r * 3);
        this.ctx.stroke();
      }
    });

    this.ctx.restore();
  }

  // 5. Meteorites Overlay (Shooting fireballs across camera)
  drawMeteoritesOverlay(t) {
    // Keep ambient stars in background
    this.drawStarsOverlay(t);

    // Spawn meteors
    if (t > this.nextMeteorTime) {
      const isBolide = Math.random() > 0.8;
      const startX = Math.random() * (this.w * 1.1);
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.25;
      const speed = isBolide ? 32 + Math.random() * 12 : 20 + Math.random() * 15;

      this.meteors.push({
        x: startX,
        y: -30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: isBolide ? 160 : 90,
        r: isBolide ? 5 : 2.5,
        life: 1.0,
        decay: 0.012 + Math.random() * 0.01
      });

      this.nextMeteorTime = t + 240 + Math.random() * 450;
    }

    this.ctx.save();
    this.ctx.globalCompositeOperation = "screen";

    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.x += m.vx;
      m.y += m.vy;
      m.life -= m.decay;

      const tailX = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.len;
      const tailY = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.len;

      // Fiery gradient trail
      const grad = this.ctx.createLinearGradient(m.x, m.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255, 255, 255, ${m.life})`);
      grad.addColorStop(0.2, `rgba(254, 240, 138, ${m.life * 0.9})`);
      grad.addColorStop(0.5, `rgba(255, 69, 0, ${m.life * 0.7})`);
      grad.addColorStop(1, "rgba(220, 38, 38, 0)");

      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = m.r * 2;
      this.ctx.lineCap = "round";
      this.ctx.beginPath();
      this.ctx.moveTo(m.x, m.y);
      this.ctx.lineTo(tailX, tailY);
      this.ctx.stroke();

      // Blazing meteor head
      const hGrad = this.ctx.createRadialGradient(m.x, m.y, 1, m.x, m.y, m.r * 2.5);
      hGrad.addColorStop(0, "#ffffff");
      hGrad.addColorStop(0.5, "#fde047");
      hGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
      this.ctx.fillStyle = hGrad;
      this.ctx.beginPath();
      this.ctx.arc(m.x, m.y, m.r * 2.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Falling sparks
      if (Math.random() > 0.3) {
        this.meteorSparks.push({
          x: m.x,
          y: m.y,
          vx: (Math.random() - 0.5) * 2 - (m.vx * 0.05),
          vy: (Math.random() - 0.5) * 2 - (m.vy * 0.05),
          r: 1 + Math.random() * 2,
          alpha: 1.0,
          decay: 0.05
        });
      }

      if (m.life <= 0 || m.x > this.w + 100 || m.y > this.h + 100) {
        this.meteors.splice(i, 1);
      }
    }

    // Spark embers
    for (let i = this.meteorSparks.length - 1; i >= 0; i--) {
      const s = this.meteorSparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= s.decay;

      this.ctx.fillStyle = `rgba(253, 224, 71, ${s.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      this.ctx.fill();

      if (s.alpha <= 0) this.meteorSparks.splice(i, 1);
    }

    this.ctx.restore();
  }

  // Draw AR Hand Tracking on Camera (Rings on finger tips & sleek neon joints)
  drawARHandLandmarks() {
    if (!state.showSkeleton || !state.handLandmarks || state.handLandmarks.length < 21) return;

    const landmarks = state.handLandmarks;
    const mode = WEATHER_MODES[state.currentWeather] || WEATHER_MODES.sun;

    this.ctx.save();
    if (state.isCameraMirrored) {
      this.ctx.translate(this.w, 0);
      this.ctx.scale(-1, 1);
    }

    const CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring
      [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
      [0, 17]                                // Palm
    ];

    // Neon skeletal links
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = mode.accent;
    this.ctx.shadowColor = mode.accent;
    this.ctx.shadowBlur = 10;

    CONNECTIONS.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x * this.w, p1.y * this.h);
      this.ctx.lineTo(p2.x * this.w, p2.y * this.h);
      this.ctx.stroke();
    });

    // Glowing fingertips & joints
    const fingerTips = [4, 8, 12, 16, 20];
    landmarks.forEach((p, idx) => {
      const isTip = fingerTips.includes(idx);
      const px = p.x * this.w;
      const py = p.y * this.h;

      if (isTip) {
        // Glowing target ring on finger tips
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(px, py, 9, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = mode.accent;
        this.ctx.beginPath();
        this.ctx.arc(px, py, 5, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        this.ctx.beginPath();
        this.ctx.arc(px, py, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    this.ctx.restore();
  }

  // Master Render Frame
  render(t) {
    this.ctx.clearRect(0, 0, this.w, this.h);

    // 1. Draw webcam feed as base layer
    this.drawCameraFeed();

    // 2. Overlay dynamic AR weather effects
    switch (state.currentWeather) {
      case "sun":
        this.drawSunOverlay(t);
        break;
      case "rain":
        this.drawRainOverlay(t);
        break;
      case "snow":
        this.drawSnowOverlay(t);
        break;
      case "star":
        this.drawStarsOverlay(t);
        break;
      case "meteorites":
        this.drawMeteoritesOverlay(t);
        break;
    }

    // 3. Draw AR hand skeleton highlights
    this.drawARHandLandmarks();
  }
}

const arFilter = new ARWeatherFilter(canvas, ctx);
window.addEventListener("resize", () => arFilter.resize());

// Render Loop at 60 FPS
function renderLoop(timestamp) {
  arFilter.render(timestamp);
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

// ==========================================
// Weather Controller & UI Synchronizer
// ==========================================
function setWeather(weatherKey, manual = false) {
  if (!WEATHER_MODES[weatherKey]) return;
  if (state.currentWeather === weatherKey && !manual) return;

  state.currentWeather = weatherKey;
  const config = WEATHER_MODES[weatherKey];

  document.body.setAttribute("data-weather", weatherKey);
  audio.setWeather(weatherKey);

  // Update Status Pill
  statusGesture.textContent = config.badge;
  statusWeather.textContent = config.title;

  // Update Dock Buttons
  dockBtns.forEach(btn => {
    if (btn.getAttribute("data-weather") === weatherKey) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  if (manual) {
    showToast(`${config.icon} ${config.title}`);
  }
}

// ==========================================
// MediaPipe Hands & Gesture Vision Pipeline
// ==========================================
function countExtendedFingers(landmarks) {
  if (!landmarks || landmarks.length < 21) return 0;
  let count = 0;
  const wrist = landmarks[0];

  function dist(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  // Thumb
  const thumbTip = landmarks[4];
  const thumbIP = landmarks[3];
  const pinkyMCP = landmarks[17];
  const indexMCP = landmarks[5];
  if (dist(thumbTip, pinkyMCP) > dist(thumbIP, pinkyMCP) * 1.15 &&
      dist(thumbTip, indexMCP) > dist(thumbIP, indexMCP) * 1.1) {
    count++;
  }

  // Index (8) vs PIP (6)
  if (landmarks[8].y < landmarks[6].y || dist(landmarks[8], wrist) > dist(landmarks[6], wrist) * 1.25) count++;
  // Middle (12) vs PIP (10)
  if (landmarks[12].y < landmarks[10].y || dist(landmarks[12], wrist) > dist(landmarks[10], wrist) * 1.25) count++;
  // Ring (16) vs PIP (14)
  if (landmarks[16].y < landmarks[14].y || dist(landmarks[16], wrist) > dist(landmarks[14], wrist) * 1.25) count++;
  // Pinky (20) vs PIP (18)
  if (landmarks[20].y < landmarks[18].y || dist(landmarks[20], wrist) > dist(landmarks[18], wrist) * 1.25) count++;

  return count;
}

const buffer = [];
const BUFFER_LEN = 6;

function onHandResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    state.handLandmarks = results.multiHandLandmarks[0];
    const rawFingers = countExtendedFingers(state.handLandmarks);

    buffer.push(rawFingers);
    if (buffer.length > BUFFER_LEN) buffer.shift();

    const counts = {};
    buffer.forEach(n => counts[n] = (counts[n] || 0) + 1);
    let stable = rawFingers;
    let max = 0;
    for (let k in counts) {
      if (counts[k] > max) {
        max = counts[k];
        stable = parseInt(k, 10);
      }
    }

    state.fingerCount = stable;

    // Trigger weather if sustained for 4+ frames
    if (max >= 4) {
      switch (stable) {
        case 1: setWeather("sun"); break;
        case 2: setWeather("rain"); break;
        case 3: setWeather("snow"); break;
        case 4: setWeather("star"); break;
        case 5: setWeather("meteorites"); break;
        case 0: setWeather("idle"); break;
      }
    }
  } else {
    state.handLandmarks = null;
  }
}

// Start MediaPipe Vision & Webcam
async function startWebcamVision() {
  cameraLoader.classList.remove("hidden");
  loaderTitle.textContent = "Connecting to Webcam...";
  loaderSub.textContent = "Initializing camera & AI vision models...";

  try {
    if (typeof Hands === "undefined") {
      throw new Error("MediaPipe library not loaded.");
    }

    const hands = new Hands({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    hands.onResults(onHandResults);

    if (typeof Camera !== "undefined") {
      const cam = new Camera(video, {
        onFrame: async () => {
          await hands.send({ image: video });
        },
        width: 1280,
        height: 720
      });
      await cam.start();
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
      });
      video.srcObject = stream;
      await video.play();

      async function loop() {
        await hands.send({ image: video });
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }

    state.cameraReady = true;
    cameraLoader.classList.add("hidden");
    showToast("Webcam connected! Show your fingers.", "📷");
  } catch (err) {
    console.warn("Camera init warning:", err);
    loaderTitle.textContent = "Camera Access Blocked or Unavailable";
    loaderSub.innerHTML = `You can still test and enjoy all weather animations using the buttons below or keys 1-5.<br><small>${err.message || ""}</small>`;
    enableCamBtn.classList.remove("hidden");
    showToast("Interactive mode enabled! Click icons below.", "💡");
  }
}

// ==========================================
// Event Listeners & UI Controls
// ==========================================

// Sound Toggle
soundBtn.addEventListener("click", () => {
  const isPlaying = audio.toggle();
  state.isSoundOn = isPlaying;
  soundIcon.textContent = isPlaying ? "🔊" : "🔇";
  soundBtn.classList.toggle("active", isPlaying);
  showToast(isPlaying ? "Sound on 🔊" : "Sound muted 🔇");
});

// Flip Camera Mirror
flipBtn.addEventListener("click", () => {
  state.isCameraMirrored = !state.isCameraMirrored;
  showToast(state.isCameraMirrored ? "Camera mirrored" : "Normal orientation");
});

// Hand Skeleton Toggle
skeletonBtn.addEventListener("click", () => {
  state.showSkeleton = !state.showSkeleton;
  skeletonBtn.classList.toggle("active", state.showSkeleton);
  showToast(state.showSkeleton ? "Hand tracking visible" : "Hand tracking hidden");
});

// Permission retry button
enableCamBtn.addEventListener("click", () => {
  enableCamBtn.classList.add("hidden");
  startWebcamVision();
});

// Bottom Dock Buttons Click
dockBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const w = btn.getAttribute("data-weather");
    setWeather(w, true);
  });
});

// Keyboard Shortcuts: 1, 2, 3, 4, 5, 0, M
window.addEventListener("keydown", (e) => {
  if (e.key === "1") setWeather("sun", true);
  if (e.key === "2") setWeather("rain", true);
  if (e.key === "3") setWeather("snow", true);
  if (e.key === "4") setWeather("star", true);
  if (e.key === "5") setWeather("meteorites", true);
  if (e.key === "0") setWeather("idle", true);
  if (e.key.toLowerCase() === "m") soundBtn.click();
});

// Initialize on DOM Ready
window.addEventListener("DOMContentLoaded", () => {
  arFilter.resize();
  setWeather("sun");
  setTimeout(startWebcamVision, 250);
});
