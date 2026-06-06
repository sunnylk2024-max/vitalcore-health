# VitalCore Setup Guide

## Requirements
- Raspberry Pi 4B (2GB+ RAM recommended 4GB+)
- Docker installed
- Home router with ethernet connection

## Installation

### Step 1 — Clone the repo
```bash
git clone https://github.com/sunnylk2024-max/vitalcore-health.git
cd vitalcore-health
```

### Step 2 — Copy files to your Pi
```bash
mkdir -p ~/pistack/vitalcore
cp index.html manifest.json sw.js ~/pistack/vitalcore/
```

### Step 3 — Add to Docker stack
Add the vitalcore service to your `~/pistack/docker-compose.yml`:
```yaml
  vitalcore:
    image: nginx:alpine
    container_name: vitalcore
    restart: unless-stopped
    ports:
      - "8090:80"
    volumes:
      - /home/pi/pistack/vitalcore:/usr/share/nginx/html:ro
```

### Step 4 — Start
```bash
cd ~/pistack && docker compose up -d
```

### Step 5 — Access
Open `http://[your-pi-ip]:8090` on any device on your home network.

## Update from GitHub
```bash
cd ~/pistack/vitalcore
curl -o index.html https://raw.githubusercontent.com/sunnylk2024-max/vitalcore-health/main/index.html
```

## Gym Access (away from home)
Install WireGuard on your phone and connect to your home VPN before leaving.
The app then works anywhere in the world via `http://[pi-ip]:8090`.

## Features
- Dashboard with pie chart completion tracker
- Monthly calendar — tap any day to view/edit all logs
- Supplement tracker (morning, pre-workout, bedtime)
- Workout logger with per-set weights, reps, rest timer
- Treadmill tracker with photo capture
- Nutrition logging with macro tracking
- Water intake tracker
- Sleep logger with 7-day history
- Daily habit checklist
- Your daily schedule with NOW indicator
- Rest day logging
- Weight tracking with chart
- Weekly workout comparison with % change
- Personal bests tracker
- Claude AI review — copies 7-day summary as prompt
- Installable PWA — add to Android home screen

## Tech Stack
- Vanilla HTML/CSS/JS (no frameworks, no dependencies)
- Nginx Alpine via Docker
- localStorage for data persistence
- Service Worker for offline PWA support
- Tested on Raspberry Pi OS Trixie (Debian 13)
