# Automated Demo Video Generation

Generates a ~3 minute product showcase video for the Data Hub landing page without manual capture or editing.

## Prerequisites

```bash
brew install ffmpeg    # Required for video compilation
supabase start         # Local Supabase must be running
npm run dev            # Dev server at localhost:5173
```

## Quick Start

```bash
npm run video:generate
```

This single command runs the full pipeline: setup demo data → record segments → compile video.

## Individual Commands

| Command | Description |
|---------|-------------|
| `npm run video:setup` | Create demo user and sample data |
| `npm run video:record` | Record 8 chapter segments via Playwright |
| `npm run video:compile` | Compile segments with transitions, overlays, audio |
| `npm run video:generate` | Run all steps in sequence |

## Pipeline Flow

```
1. Setup Demo Data     → Creates test user, client, sources, warehouse
2. Record Segments     → Playwright captures 8 WebM segments
3. Compile Video       → ffmpeg: concat + crossfades + title overlays + audio
4. Generate Outputs    → MP4, WebM, poster frame
```

## Output Files

```
client/public/assets/demo/
├── data-hub-demo.mp4    # H.264, web-optimized
├── data-hub-demo.webm   # VP9 for broader support
├── demo-poster.jpg      # Auto-extracted poster frame
└── segments/            # Raw chapter recordings
```

## Video Chapters

| # | Chapter | Duration | Content |
|---|---------|----------|---------|
| 1 | Hero | 10s | Landing page, mission tagline |
| 2 | Login | 15s | Authentication flow |
| 3 | Dashboard | 20s | Client overview, stats |
| 4 | Source Wizard | 40s | Add Data Source (4 steps) |
| 5 | Warehouse | 30s | Create Data Warehouse |
| 6 | Report Builder | 40s | Build Report (4 steps) |
| 7 | Lineage | 15s | Data Lineage view |
| 8 | Outro | 10s | Return to dashboard, CTA |

## Background Music (Optional)

Place an MP3 file at `client/public/assets/demo/audio/background.mp3`.

Recommended: [Fantasy Medieval Ambient](https://pixabay.com/music/folk-fantasy-medieval-ambient-237371/) from Pixabay (free, no attribution required).

The compiler will auto-mix with fade in/out. If no music file exists, video generates silently.

## Customization

### Adjust Timing
Edit `CONFIG.chapters` in `scripts/record-demo.js` to change chapter durations.

### Change Title Style
Edit `CONFIG.titleStyle` in `scripts/compile-demo.js` for overlay appearance.

### Poster Frame
Edit `CONFIG.posterTimestamp` in `scripts/compile-demo.js` to extract from different point.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "ffmpeg not found" | `brew install ffmpeg` |
| "Dev server not running" | Run `npm run dev` first |
| Recording fails | Ensure Supabase is running, credentials valid |
| No segments found | Run `npm run video:record` before compile |
