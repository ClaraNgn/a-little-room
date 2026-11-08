# The Abroad Chapter — Chapter 1: Beginnings

A playable, buildless browser prototype based on the creator's handwritten Chapter 1 idea.

Story flow: lobby → three first-person Clara introductions → Clara's room in Vietnam on the night before her flight to study in the U.S. → packing → the next morning → airport check-in → a message home → boarding → four-second sky film → United States → chapter completion.

## Play

The separate `The-Abroad-Chapter.html` download opens in a normal browser. To generate it from this source, run `python3 export_standalone.py`, then open `chapter1-standalone.html`. Images, styles and game code are embedded; online Google Fonts are optional and system fonts are used offline.

For source development, run `python3 -m http.server 4176` from this folder and visit `http://localhost:4176/`.

## Interaction

- Six sample story objects: passport, school uniform, laptop, family photo, film roll, letter.
- The room fills the viewport. Clara gives the packing task and progress through a compact chat window. The chat can be minimized.
- Select an object to read Clara's reflection. Drag it to the suitcase or choose “Pack it” in the chat.
- Open “My suitcase” for a close-up with six slots and the object inventory. On narrow screens, pan the room by swiping or with the look-around buttons.
- Select an occupied suitcase slot to unpack it. Objects disappear from the room when packed.
- The close-suitcase button unlocks at 6/6. The packed-suitcase screen offers review or “Sleep until morning”.
- Keyboard: Tab and Enter; Escape dismisses dialogs. English-only text and optional synthesized music.
- Progress is saved locally on the same browser/device when localStorage is available. No account, analytics or server storage.

These six objects and dialogue are sample content added for this prototype. Story data and object positions are in `app.js`; visuals/layout in `style.css`.

## Art

New night-room background, passport, clothes and laptop generated with ImageGen. Full prompts: `art-source/imagegen-prompts.json`. Clara, lobby, family photo, notebook and mug reuse the approved previous game assets. Original PNG alpha is preserved; all referenced files are included.

## GitHub Pages

The source folder is static and does not require a build or API key. Upload `index.html`, `style.css`, `app.js` and all referenced image assets to the repository root, then enable Pages for the chosen branch. Published game: https://clarangn.github.io/a-little-room/ — repository: https://github.com/ClaraNgn/a-little-room.

## Prototype scope

Chapter 1 includes departure from Vietnam and the flight toward the United States. It ends at the new horizon; Chapter 2 is playable at ?chapter=2: find the classroom, ask Ben for directions, locate the library, and save an event invitation at Student Center to collect all three stamps. The airport is a fictional story scene, not a simulation of a specific airport, airline or real itinerary.

## Verified

Played the complete lobby-to-completion flow; tested native pointer dragging, keyboard selection/packing, custom slots, unpacking, reload persistence, chat actions, narrow-screen room panning, and the standalone export. Responsive layout checked at 390 × 844 with no horizontal overflow or broken images.

## Lobby menu update

The lobby now presents three matching framed buttons: Begin my story, How to play and Introduction. Introduction describes Clara’s story and offers a direct start button. The previous eyebrow, tagline and footer copy have been removed.

## School uniform object

The former Clothes object is now School uniform, based on the user-approved Le Quy Don High School blouse artwork. The existing clothes ID is retained for saved-game compatibility. The served school-uniform.svg wraps a lossless WebP encoding of the approved PNG; every RGBA pixel matches the source. The standalone export embeds the approved PNG directly.

## Departure and flight

After packing, choose Sleep until morning, then Leave for the airport. Three chat-led tasks: check in with the passport, choose a message home, and go to the gate. After boarding, a simple four-second video shows a little airplane bobbing past soft volumetric clouds. It automatically continues to Hello, America. The morning transition is a 3.5-second night-to-morning film in Clara’s actual room that automatically opens the airport scene. All messages stay inside the game. No external messaging or form submission occurs.

The existing localStorage key and six item IDs are preserved. Old packed saves can continue to departure; new saves retain the journey scene and selected message. Legacy ocean/arrival saves resume through the new flight clip. The lobby now uses the supplied three-button menu; Begin my story! returns through Clara’s introduction to her room. Replay Chapter 1 clears only this game's progress.

Two new airport and flight backgrounds were generated with built-in ImageGen. Originals are retained as PNG; web SVG files embed quality-95 WebP encodings with original dimensions. Prompts: art-source/departure-prompts.json. The character artwork and approved uniform are unchanged.

## Short films

Two short animations made from the game’s own art direction and rendered with Core Graphics and FFmpeg: morning-transition.mp4 (3.5 seconds) and flight-transition.mp4 (4 seconds), H.264, 960x720, 24fps, silent. Both are embedded with JPEG posters in journey-clips.js, so the published static game needs no video service. The standalone exporter embeds that script as well. Frame source: art-source/video/render-frames.swift; encoder: art-source/video/encode-clips.py.

Clips play muted and inline, continue on ended, and offer Skip. If autoplay is blocked, Play animation appears. Reduced-motion preference shows a still and Continue, with optional playback. The clip pauses while the document is hidden, and stops when returning to the lobby. Watch flight again replays the sky clip.

## Art consistency revision

Short films now match the existing soft low-poly 2.5D game. The morning film dissolves from the actual night-room artwork into its daylight version, retaining the furniture and closed lilac suitcase. The flight uses a shaded cream/blue airplane with a green tail and volumetric cream clouds on a simple blue sky, with playful bobbing. Original 3.5s and 4s timing and player behavior are retained.

Plane/cloud sprites and the daylight room were made with built-in ImageGen using the game's own room/airport artwork as references. Source PNGs and prompts are retained in art-source/video/cohesive/. Swift renders PNG frames and FFmpeg encodes H.264; build-clip-bundle.py embeds the MP4s and JPEG posters. The previous flat vector art remains in versions/before-cohesive-clips/.

To rebuild clips, compile render-frames.swift with swiftc -O, then pass the source root and a temporary frame-output directory to the executable. Run encode-clips.py --frames <that-directory> --ffmpeg <ffmpeg-path>, build-clip-bundle.py, and export_standalone.py.

## Clara copy and item revision

The character is Clara throughout the visible interface, introduction, dialogue, help, boarding pass and accessible labels. Lobby menu order is Introduction, How to play, Begin my story! The extra resume button, door-hover text, suitcase toast, generic introduction scope sentence and room Beginnings heading were removed to match the supplied sections 1–6. Progress remains stored on the same browser. Airport and later content is retained, as confirmed by the creator.

The old notebook and mug storage IDs now represent Film roll and Letter, so saved packed positions remain compatible. Visible labels, reflections and sprites are replaced; the original sprite files are archived and no longer referenced by the live asset bank. New artwork uses built-in ImageGen and the approved 2.5D art direction. Sources and prompts: art-source/clara-items/.


## Chapter 2: Finding my way

Continue from Chapter 1, or open `?chapter=2`. Read the handwritten parchment map and find the classroom. Talk to Ben: Clara asks for library directions in one fixed line, then Continue reveals his reply. Follow his directions to the library, then use the map to find Student Center and save the orientation invitation. Each destination adds one stamp to the approved illustrated collection paper. Finish with three stamps and a short reflection.

Campus locations on the map can be revisited; trying a destination before its story step gives a hint. No timer or failure reset. Map knowledge, conversation, visited scene and stamps persist locally with migration from the earlier one-stamp version. Replay Chapter 2 resets only campus progress and preserves Chapter 1 packing. Later chapters are not implemented here.

Campus scenery, Ben and the simple stamp paper use the creator-reviewed ImageGen assets under `art-source/chapter2/`. The served SVG files wrap WebP images; source PNGs and prompts are retained. The map and stamp sheet have accessible text alternatives and buttons. The stamp paper has no Kent State branding, flower or My first day subtitle. No event registration, real calendar update or external messages are sent.


## Chapter 3 — Making room

Continue from Chapter 2, or open `?chapter=3`. Clara's approved compact dorm has one bed, one desk and one wardrobe. Tap the laptop, reading book and glowing phone to make three decisions during a one-hour evening. The assignment needs 30 minutes and two energy; reading can take 15 minutes or wait until tomorrow; home can receive a 15-minute call or a five-minute reply. The player keeps ten minutes for rest and finishes by tapping the bed. Time advances only on decisions, with no real-time countdown. Multiple plans work.

`desk-planner.js` owns the time/energy rules, save validation and undo. My evening restores the selected task's time and energy without affecting Chapters 1 or 2. Chapter 3 replay resets only the evening. All scene changes hide other chapters, and local progress persists on the same browser/device. Keyboard and touch controls, collapsible chat, side-to-side room navigation and reduced-motion support are included. No messages, work confirmations or assignments leave this fictional game.

Dorm art is the approved `art-source/chapter3/dorm-room-v5/dorm-room.png`, based on the supplied residence-hall photos and previous Chapter 1 style. It retains the wardrobe rotated along the left wall and the straight study desk at the right. Original revisions and ImageGen prompts are retained. `dorm-room.svg` embeds a quality-95 WebP; the existing Clara and phone artwork are reused.


## Clara and Ben in-scene conversation

The campus conversation now uses four speech bubbles anchored to the speaking character, with no modal backdrop or blur. Continue advances Ben -> Clara -> Ben -> Clara. Clara's original thought appears in her bubble as italic text. Ben's directions unlock the library; the final button returns to exploration. Close/Escape leaves the scene usable, and phone-size camera framing keeps both characters visible. Student Center now advertises International Student Orientation.
