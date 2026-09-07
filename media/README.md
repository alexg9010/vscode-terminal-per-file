# Media assets

- `icon.png` / `icon.svg` — extension icon (`icon.png` is generated from
  `icon.svg` via `rsvg-convert -w 128 -h 128 icon.svg -o icon.png`).
- `demo.gif` — animated walkthrough used at the top of the main README.
- `screenshot-file-scope.png` — three files, three separate pinned terminals.
- `screenshot-directory-scope.png` — files in the same folder sharing one
  pinned terminal.

## How the screenshots/GIF were made

Captured from a real Extension Development Host session against a small demo
workspace:

```
tpf-demo/
  .vscode/settings.json   # { "terminalPerFile.scope": "file" }
  server.js
  client.js
  utils/
    helpers.js
```

1. Launch the Extension Development Host (`F5` in this repo, or
   `code --extensionDevelopmentPath=$PWD --new-window tpf-demo`).
2. Switch between `server.js` → `client.js` → `utils/helpers.js` to show three
   separate pinned terminals accumulate (**file scope**) — this produced
   `screenshot-file-scope.png`.
3. Edit `tpf-demo/.vscode/settings.json` to `"terminalPerFile.scope": "directory"`
   and save it (VS Code picks up the change live).
4. Switch between the same files again: `server.js`/`client.js` now share one
   `tpf-demo` terminal, and `helpers.js` gets its own `utils` terminal
   (**directory scope**) — this produced `screenshot-directory-scope.png`.
5. `demo.gif` is the same sequence of frames stitched together, e.g.:
   ```bash
   magick -resize 900x img1.png img2.png ... resized-imgN.png
   magick -dispose previous -delay 160 resized-img1.png -delay 160 resized-img2.png \
     ... -delay 260 resized-imgN.png -loop 0 demo.gif
   ```
   (or, from an actual screen recording: `ffmpeg -i demo.mov -vf "fps=12,scale=900:-1:flags=lanczos" -loop 0 demo.gif`)

To refresh these after a UI-relevant change, repeat the same steps against a
similar small workspace.
