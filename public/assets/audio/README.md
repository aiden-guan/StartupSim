# Compounding audio runtime assets

The six authored MP3 tracks in `music/` are the primary soundtrack and follow the physical office progression:

| Stage | Runtime asset | Source |
| --- | --- | --- |
| Apartment | `compounding.mp3` | `01 - Compounding.mp3` |
| First real office | `first-real-office.mp3` | `02 - First Real Office.mp3` |
| Startup HQ | `scale-up-velocity.mp3` | `03 - Scale-Up Velocity.mp3` |
| AI lab | `compounding-intelligence.mp3` | `04 - Compounding Intelligence.mp3` |
| Campus | `compounding-the-future.mp3` | `05 - Compounding the Future.mp3` |
| Global headquarters | `global-headquarters.mp3` | `06 - Compounding Global Headquarter.mp3` |

Runtime music is MP3 at 48 kHz / 160 kbps. The files were offline loudness-compensated around -18 LUFS with true-peak headroom, and their natural trailing silence was trimmed before a 2.5-second tail-to-intro crossfade was baked into each file. `src/audio/musicState.ts` supplies the loop bounds used by Web Audio.

The authored positive cue is `sfx/completion.mp3`, a 1.60-second normalized one-shot from `Create_a_premium,_hi_#4-1789878874655.mp3`. The previous repeated `CompletionSFX` source is no longer used. `sfx/error.mp3` is the normalized short warning cue from `ErrorSFX.mp3`. Routine interactions continue to use the existing WAV cues and procedural fallback.

Missing or undecodable assets fail quietly; gameplay does not wait for audio. The Web Audio master, music, SFX, and ambient buses remain independently controlled by the settings panel.
