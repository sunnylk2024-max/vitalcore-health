# vitalcore-health
Self-hosted personal health tracker PWA for Raspberry Pi


# VitalCore — Self-Hosted Personal Health Tracker

A lightweight PWA (Progressive Web App) health tracker 
designed to run on a Raspberry Pi 4B home server.

## Features
- 💊 Supplement timing tracker (pre-loaded with your stack)
- 🏋️ Workout logger with per-set weights, reps, duration
- 🏃 Treadmill session tracker with photo capture
- 🍽️ Nutrition logging with macro tracking
- 💧 Water intake tracker
- 😴 Sleep logger with history
- ✅ Daily habit checklist
- 📅 Personal schedule with NOW indicator
- 📊 Weekly workout comparison & personal bests
- 🤖 Claude AI review — copies your data as a prompt
- 📱 Installable PWA — works like a native Android app
- 🔒 100% self-hosted — your data never leaves your Pi

## Requirements
- Raspberry Pi 4B (2GB+ RAM)
- Docker installed
- Any home router

## Quick Install
1. Clone this repo
2. Copy files to ~/pistack/vitalcore/ on your Pi
3. Add to your docker-compose.yml (see docs)
4. Open http://[pi-ip]:8090

## Roadmap
- [ ] Samsung Health / Health Connect integration
- [ ] Gemini AI food photo analysis
- [ ] Multi-user support with SparkyFitness
- [ ] Cloudflare Tunnel for global access
- [ ] Weekly shopping list generator

## Contributing
Pull requests welcome! See CONTRIBUTING.md

## Built With
- Vanilla HTML/CSS/JS — no frameworks
- Nginx Alpine (Docker)
- Raspberry Pi OS Trixie
