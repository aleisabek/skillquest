#!/usr/bin/env bash
# Installs the SkillQuest labs into WSL. Run from Windows:
#   wsl bash /mnt/c/Users/User/Documents/SkillQuest/labs/install.sh
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.skillquest-labs"
rm -rf "$DEST"; mkdir -p "$DEST"
cp -r "$SRC/labs" "$SRC/sq-lab" "$DEST/"
# Files may come from Windows; make sure they use Linux line endings and are runnable.
find "$DEST" -type f \( -name '*.sh' -o -name sq-lab \) -exec sed -i 's/\r$//' {} +
chmod +x "$DEST/sq-lab"
mkdir -p "$HOME/.local/bin"
ln -sf "$DEST/sq-lab" "$HOME/.local/bin/sq-lab"
if ! grep -q 'skillquest-labs' "$HOME/.bashrc" 2>/dev/null; then
  printf '\n# skillquest-labs\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$HOME/.bashrc"
fi
echo "SkillQuest labs installed. Open a new Ubuntu terminal (or run: source ~/.bashrc), then type: sq-lab"
