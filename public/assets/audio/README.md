# Compounding audio drafts

These are original, locally rendered sound drafts. `scripts/render_audio.py` contains every note and texture; no third-party samples or commercial recordings are used.

`music/` contains six synchronized 16-second loops. `src/audio/musicState.ts` mixes them by company stage; `src/audio/Audio.ts` crossfades the layers, ducks them under major cues, and keeps music, ambience, and effects on separate volume buses. `sfx/` contains short cues for UI, money, research, products, people, market moves, messages, and major business moments.

The current files are mono 22.05 kHz PCM WAVs because a compressed encoder was unavailable on this host. The full set is about 4.5 MB. They work as browser assets but should receive final sound design, mastering, and compressed Ogg/MP3 exports before a production audio release. When replacing them, keep the six music loops equal in duration and tempo, then update the asset extension in `src/audio/Audio.ts`. Missing or undecodable files fall back to a quiet procedural cue where appropriate; gameplay never waits on audio.
