#!/usr/bin/env python3
"""
Hotfix — add peekAt to the Message type in deeptalk and training.

The previous patch skipped this because it checked for the literal
"peekAt?: string" anywhere in the file, and MessageBubble's signature
already contained it. This one targets the type declaration specifically.

Run from repo root:
    cd ~/Desktop/hisame-z-home
    python3 fix_message_type.py
"""

import re
import sys
import shutil
import pathlib

FILES = [
    pathlib.Path("src/app/deeptalk/[id]/page.tsx"),
    pathlib.Path("src/app/training/[id]/page.tsx"),
]

# Matches `type Message = { ... }` — the declaration only, not the component
TYPE_RE = re.compile(r"(type\s+Message\s*=\s*\{)([^}]*)(\})")


def patch(path: pathlib.Path) -> None:
    print(f"── {path.name} ({path.parent.parent.name}) ──")
    if not path.exists():
        print(f"  ❌ not found")
        sys.exit(1)

    text = path.read_text(encoding="utf-8")
    m = TYPE_RE.search(text)

    if not m:
        print("  ❌ could not find `type Message = { ... }`")
        print("     Run this to inspect the top of the file:")
        print(f"     head -25 '{path}'")
        sys.exit(1)

    body = m.group(2)

    if "peekAt" in body:
        print("  · type already has peekAt")
        return

    # Match the file's own separator style
    sep = ";" if ";" in body else ""
    indent = "  "
    for line in body.split("\n"):
        stripped = line.lstrip()
        if stripped and not stripped.startswith("//"):
            indent = line[: len(line) - len(stripped)] or "  "
            break

    trimmed = body.rstrip()
    new_body = f"{trimmed}\n{indent}peekAt?: string{sep}\n"
    new_text = text[: m.start()] + m.group(1) + new_body + m.group(3) + text[m.end():]

    shutil.copy(path, str(path) + ".type.bak")
    path.write_text(new_text, encoding="utf-8")
    print("  ✓ added peekAt to Message type")


def main() -> None:
    for f in FILES:
        patch(f)

    print()
    print("✅ Done. Verify both look right:")
    print("  grep -n -A 10 'type Message' 'src/app/deeptalk/[id]/page.tsx'")
    print("  grep -n -A 10 'type Message' 'src/app/training/[id]/page.tsx'")
    print()
    print("Then:")
    print("  git add -A")
    print("  git commit -m 'fix: peekAt on Message type'")
    print("  git push")


if __name__ == "__main__":
    main()
