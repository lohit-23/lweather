<div align="center">

# 🌤️ AuraWeather AR
### Augmented Reality Weather Experience Powered by Real-Time Hand Gesture Vision

[![Deploy to Netlify](https://img.shields.io/badge/Deploy_to-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://app.netlify.com/start)
[![MediaPipe](https://img.shields.io/badge/Google_MediaPipe-Hands_AI-0097A7?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/mediapipe)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

<p align="center">
  <b>AuraWeather AR</b> is a camera-first Augmented Reality web application that turns your browser into an interactive, gesture-controlled celestial mirror. Using on-device AI computer vision, it translates human hand gestures into immersive, non-obscuring atmospheric phenomena rendered in real time.
</p>

<p align="center">
  <a href="https://app.netlify.com/start">
    <img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" height="38"/>
  </a>
</p>

</div>

---

## 🚀 Deployment (Netlify)

Deploy this project live on Netlify with automatic HTTPS, camera permissions headers, and SPA redirects configured:

### Option 1: Git Integration (Recommended)
1. Push this repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Log in to your **[Netlify Dashboard](https://app.netlify.com/)** and select **Add new site** > **Import an existing project**.
3. Select your repository. Netlify automatically detects [`netlify.toml`](netlify.toml), setting the publish directory to root (`.`), configuring camera security headers, and setting up rewrite rules.
4. Click **Deploy auraweather-ar**.

### Option 2: Netlify Drop (Manual Drag & Drop)
1. Navigate to **[Netlify Drop](https://app.netlify.com/drop)**.
2. Drag and drop the project folder directly into the browser upload zone.
3. Your site will be deployed instantly with SSL and camera support.

---

## 🌟 Architectural Highlights

- **🎥 Camera-First Augmented Reality Viewport**: The webcam stream acts as the continuous primary layer. Weather particles and atmospheric effects are composited using non-destructive blend modes (`screen` and `source-over`), ensuring the user's face and body remain 100% visible.
- **🖐️ 21-Point 3D Hand Pose Pipeline**: Integrates Google MediaPipe Hands running in client-side WebAssembly to calculate 3D Euclidean distances and joint orientations at 60 FPS.
- **⚡ Temporal Majority Voting Heuristic**: Implements a rolling-window modal stabilizer to eliminate pose flickering and provide smooth, intentional weather transitions.
- **🔊 Zero-Asset Procedural Web Audio Engine**: Mathematically generates dynamic soundscapes (filtered pink noise for rainfall, sub-bass oscillators for rolling thunder, resonant chimes, and doppler whooshes) with 0 external audio dependencies.
- **🛡️ 100% On-Device Edge Privacy**: Video frames never leave the client's device. Inference is performed strictly in local memory.

---

## ✋ Gesture Recognition Matrix

| Fingers | Gesture | Phenomenon | Atmospheric Particle Simulation | Procedural Soundscape |
| :---: | :---: | :--- | :--- | :--- |
| **1** | ☝️ Single Finger | **Golden Sun** | Radial solar corona, 14 rotating sunbeams, chromatic lens flares, and floating golden dust motes | Harmonic sinusoidal warmth & gentle summer breeze |
| **2** | ✌️ Peace Sign | **Torrential Rain** | High-velocity slanted rain streaks, surface splash ripples, camera glass condensation droplets, and dynamic lightning flashes | Multi-pole low-pass pink noise with sub-bass thunder booms |
| **3** | 🤟 Three Fingers | **Crystal Snow** | Multi-depth 3D drifting snowflakes with sinusoidal wind turbulence and soft frosted perimeter vignette | Bandpass-filtered cold wind with resonant crystalline high frequencies |
| **4** | 🖖 Four Fingers | **Cosmic Stars** | 200+ twinkling celestial bodies with diffraction spikes and wavy undulating Aurora Borealis ribbons | Deep space drone dual-oscillator with ethereal fifth harmonics |
| **5** | 🖐️ Open Hand | **Meteor Shower** | Hyper-velocity flaming bolides with multi-stop fiery plasma tails and dissipating ember spark fragments | Low-frequency sawtooth drone with randomized doppler sweeps |
| **0** | ✊ Closed Fist | **Twilight Rest** | Calm ambient starlight in awaiting state | Neutral ambient silence |

---

## 🏗️ System Architecture & Data Flow

```text
[ Webcam Stream (1080p/720p) ]
              │
              ├──► [ MediaPipe Hands Vision Worker ]
              │             │
              │             ▼
              │    [ 21 3D Landmarks Extraction ]
              │             │
              │             ▼
              │    [ Joint Distance & Angle Analysis ]
              │             │
              │             ▼
              │    [ Temporal Smoothing Buffer (N=6) ]
              │             │
              │             ▼
              │    [ Gesture State Machine Trigger ]
              │             │
              ├─────────────┼─────────────────────────┐
              ▼             ▼                         ▼
      [ HTML5 AR Canvas ]  [ Glassmorphic HUD ]  [ Procedural Web Audio ]
      • Mirrored Video     • Active Gesture Pill • Dynamic Oscillators
      • Weather Particles  • Finger Counter      • Biquad Noise Filters
      • AR Finger Target   • Theme Palette       • Real-time Spatial Gain
```

---

## ⌨️ Controls & Accessibility Fallback

For testing in low-light conditions or environments without a camera:

| Input | Target Weather State |
| :---: | :--- |
| `Key 1` or Bottom Dock Card 1 | **Golden Sun** ☀️ |
| `Key 2` or Bottom Dock Card 2 | **Torrential Rain** 🌧️ |
| `Key 3` or Bottom Dock Card 3 | **Crystal Snow** ❄️ |
| `Key 4` or Bottom Dock Card 4 | **Cosmic Stars** ✨ |
| `Key 5` or Bottom Dock Card 5 | **Meteor Shower** ☄️ |
| `Key 0` or Bottom Dock Card 0 | **Twilight Rest** ⛅ |
| `Key M` or Top Sound Button | **Audio Toggle (Mute / Unmute)** 🔊 |
| `Top Flip Button` | **Camera Mirror / Normal Orientation** 🔄 |
| `Top Hand Button` | **AR Hand Skeleton Visibility** 🖐️ |

---

## 📂 Project Structure

```text
auraweather-ar/
├── index.html        # Semantic AR viewport container, HUD overlay & MediaPipe imports
├── style.css         # Modern glassmorphism system, responsive tokens, theme variables
├── script.js         # Core MediaPipe vision engine, particle simulation & audio synthesizer
├── netlify.toml      # Netlify configuration with camera permission headers & rewrites
└── README.md         # Technical documentation & Netlify deploy guide
```

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/auraweather-ar.git
cd auraweather-ar

# Run via any local static server
npx serve .
# or
python -m http.server 3000
```

---

## 📄 License

This project is open-source under the **MIT License**. See the `LICENSE` file for details.

<div align="center">
  <sub>Engineered with precision for Creative AI, WebGL/Canvas2D, and Augmented Reality.</sub>
</div>
