#!/usr/bin/env sh
set -e

CONFIG_DIR="$HOME/.config/degoog"
mkdir -p "$CONFIG_DIR"

docker run --rm -it \
  -e DEGOOG_CONFIG_HOME=/degoog-config \
  -v "$CONFIG_DIR:/degoog-config" \
  -v "$(pwd):/workspace" \
  -w /workspace \
  ghcr.io/degoog-org/cli:latest "$@"
