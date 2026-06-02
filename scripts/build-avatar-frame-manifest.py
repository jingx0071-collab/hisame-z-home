from pathlib import Path
import json

root = Path("public/skins")
exts = {".png", ".webp", ".jpg", ".jpeg", ".gif"}

for skin_dir in root.iterdir() if root.exists() else []:
    frames_dir = skin_dir / "avatar-frames"
    if not frames_dir.exists() or not frames_dir.is_dir():
        continue

    files = []
    for item in sorted(frames_dir.iterdir()):
        if item.is_file() and item.suffix.lower() in exts and item.name != "manifest.json":
            files.append(f"/skins/{skin_dir.name}/avatar-frames/{item.name}")

    (frames_dir / "manifest.json").write_text(
        json.dumps(files, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"{skin_dir.name}: {len(files)} frame(s)")
