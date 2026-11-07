# The Abroad Chapter — Chapter 1: Beginnings

A playable, buildless browser prototype based on the creator's handwritten Chapter 1 idea.

Story flow: lobby → three first-person Jenny introductions → Jenny's room in Vietnam on the night before her flight to study in the U.S. → packing → the next morning → airport check-in → a message home → boarding → four-second sky film → United States → chapter completion.

## Play

The separate `The-Abroad-Chapter.html` download opens in a normal browser. To generate it from this source, run `python3 export_standalone.py`, then open `chapter1-standalone.html`. Images, styles and game code are embedded; online Google Fonts are optional and system fonts are used offline.

For source development, run `python3 -m http.server 4176` from this folder and visit `http://localhost:4176/`.

## Interaction

- Six sample story objects: passport, school uniform, laptop, family photo, notebook, favorite mug.
- The room fills the viewport. Jenny gives the packing task and progress through a compact chat window. The chat can be minimized.
- Select an object to read Jenny's reflection. Drag it to the suitcase or choose “Pack it” in the chat.
- Open “My suitcase” for a close-up with six slots and the object inventory. On narrow screens, pan the room by swiping or with the look-around buttons.
- Select an occupied suitcase slot to unpack it. Objects disappear from the room when packed.
- The close-suitcase button unlocks at 6/6. The packed-suitcase screen offers review or “Sleep until morning”.
- Keyboard: Tab and Enter; Escape dismisses dialogs. English-only text and optional synthesized music.
- Progress is saved locally on the same browser/device when localStorage is available. No account, analytics or server storage.

These six objects and dialogue are sample content added for this prototype. Story data and object positions are in `app.js`; visuals/layout in `style.css`.

## Art

New night-room background, passport, clothes and laptop generated with ImageGen. Full prompts: `art-source/imagegen-prompts.json`. Jenny, lobby, family photo, notebook and mug reuse the approved previous game assets. Original PNG alpha is preserved; all referenced files are included.

## GitHub Pages

The source folder is static and does not require a build or API key. Upload `index.html`, `style.css`, `app.js` and all referenced image assets to the repository root, then enable Pages for the chosen branch. Published game: https://clarangn.github.io/a-little-room/ — repository: https://github.com/ClaraNgn/a-little-room.

## Prototype scope

Chapter 1 includes departure from Vietnam and the flight toward the United States. It ends at the new horizon; campus life and Chapter 2 are not yet playable. The airport is a fictional story scene, not a simulation of a specific airport, airline or real itinerary.

## Verified

Played the complete lobby-to-completion flow; tested native pointer dragging, keyboard selection/packing, custom slots, unpacking, reload persistence, chat actions, narrow-screen room panning, and the standalone export. Responsive layout checked at 390 × 844 with no horizontal overflow or broken images.

## Lobby menu update

The lobby now presents three matching framed buttons: Begin my story, How to play and Introduction. Introduction describes Jenny’s story and offers a direct start button. The previous eyebrow, tagline and footer copy have been removed.

## School uniform object

The former Clothes object is now School uniform, based on the user-approved Le Quy Don High School blouse artwork. The existing clothes ID is retained for saved-game compatibility. The served school-uniform.svg wraps a lossless WebP encoding of the approved PNG; every RGBA pixel matches the source. The standalone export embeds the approved PNG directly.

## Departure and flight

After packing, choose Sleep until morning, then Leave for the airport. Three chat-led tasks: check in with the passport, choose a message home, and go to the gate. After boarding, a simple four-second video shows a little airplane bobbing past smiling clouds. It automatically continues to Hello, America. The morning transition is a 3.5-second sunrise and rolling-suitcase film that automatically opens the airport scene. All messages stay inside the game. No external messaging or form submission occurs.

The existing localStorage key and six item IDs are preserved. Old packed saves can continue to departure; new saves retain the journey scene and selected message. Legacy ocean/arrival saves resume through the new flight clip. Continue my journey returns to the saved scene. Replay Chapter 1 clears only this game's progress.

Two new airport and flight backgrounds were generated with built-in ImageGen. Originals are retained as PNG; web SVG files embed quality-95 WebP encodings with original dimensions. Prompts: art-source/departure-prompts.json. The character artwork and approved uniform are unchanged.

## Short films

Two original vector animations rendered locally with Core Graphics and AVFoundation: morning-transition.mp4 (3.5 seconds) and flight-transition.mp4 (4 seconds), H.264, 960x720, 24fps, silent. Both are embedded with PNG posters in journey-clips.js, so the published static game needs no video service. The standalone exporter embeds that script as well. Source: art-source/video/render-clips.swift.

Clips play muted and inline, continue on ended, and offer Skip. If autoplay is blocked, Play animation appears. Reduced-motion preference shows a still and Continue, with optional playback. The clip pauses while the document is hidden, and stops when returning to the lobby. Watch flight again replays the sky clip.
