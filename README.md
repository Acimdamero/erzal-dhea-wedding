# Wedding Invitation — Erzal & Dhea

A complete, deployable digital wedding invitation website built with pure HTML, CSS, and JavaScript. Designed with a modern minimalist aesthetic, glassmorphism touches, beat-synced animations, and smooth scroll effects.

## Features

- **Opening cover/envelope animation** — classic Indonesian digital invite experience
- **Bilingual structure** — Indonesian & English labels throughout
- **Countdown timer** — to Akad Nikah date (13 July 2026, Makkah)
- **Couple profiles** — Erzal Maulana Sandrya & Dhea Fadhillah Ramlan
- **Love story timeline** — Instagram meet (2022) through Makkah akad (2026)
- **Event schedule** — Akad Nikah (Makkah) & Resepsi (Maxi's Resto, Bandung)
- **Photo gallery** — with lightbox viewer
- **Beat-synced animations** — rhythmic visual pulse synced to background music
- **RSVP form** — frontend demo (no backend)
- **Guest book / wishes** — UI-only, adds messages locally
- **Location section** — Google Maps embed for reception venue
- **Background music** — YouTube embed with mute/unmute toggle
- **Share buttons** — copy link, WhatsApp, native share API
- **Responsive** — mobile-first design
- **Accessible** — semantic HTML, ARIA labels, reduced-motion support
- **Open Graph meta tags** — for social sharing previews

## Project Structure

```
wedding-invitation/
├── index.html              # Main page
├── css/
│   └── style.css           # All styles & beat-sync animations
├── js/
│   ├── main.js             # Interactivity & logic
│   └── beat-sync.js        # BeatEngine — rhythmic pulse
├── assets/
│   ├── ornaments/          # SVG decorative elements
│   └── photos/             # Couple photos
├── PHOTO-SUGGESTIONS.md    # Client photo recommendations
└── README.md
```

## Customization Guide

### Couple & Events

- **Names:** Erzal Maulana Sandrya (groom), Dhea Fadhillah Ramlan (bride)
- **Akad:** 13 Juli 2026 — Makkah, Saudi Arabia
- **Resepsi:** 22 Juli 2026 — Maxi's Resto, Bandung
- **Countdown target:** `AKAD_DATE` in `js/main.js`

### Background Music

Background music streams from **YouTube** via the [IFrame Player API](https://developers.google.com/youtube/iframe_api_reference):

- Current track: https://youtu.be/-a-vbOxM-6s (`YOUTUBE_VIDEO_ID = '-a-vbOxM-6s'`)
- Beat sync uses estimated **75 BPM** (`BEAT_BPM` in `js/main.js`)

### Photos

See [PHOTO-SUGGESTIONS.md](PHOTO-SUGGESTIONS.md) for professional shoot recommendations and technical specs.

## Local Development

```bash
cd wedding-invitation
python3 -m http.server 8080
```

Open http://localhost:8080 in your browser.

## Deployment

### GitHub Pages

Live site: https://acimdamero.github.io/wedding-invitation/

1. Push to `main` branch
2. Settings → Pages → source: `main` / root

## Beat-Sync Limitations

- YouTube IFrame API does **not** expose audio for Web Audio analysis
- Beat timing uses a **simulated clock** at 75 BPM, started when music plays
- Visual effects respect `prefers-reduced-motion`
- Auto-scroll pauses for 5 seconds after manual user scrolling

## License

Client project. Replace placeholder parent names and photos before final delivery.
