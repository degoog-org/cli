#!/usr/bin/env sh
# Nothing nicer than a sexy install script to get you going.
# Use me babe: curl -fsSL https://raw.githubusercontent.com/degoog-org/cli/main/install.sh | sh
set -e

INSTALL_DIR="/usr/local/bin"
CMD_NAME="degoog-cli"
IMAGE="ghcr.io/degoog-org/cli:latest"
RELEASES="https://github.com/degoog-org/cli/releases/latest/download"

GREEN="\033[32m"
RESET="\033[0m"

ok()  { printf "${GREEN}ok${RESET}  %s\n" "$1"; }
die() { printf "error: %s\n" "$1" >&2; exit 1; }

install_to() {
  if [ -w "$INSTALL_DIR" ]; then
    mv "$1" "$INSTALL_DIR/$CMD_NAME"
  else
    sudo mv "$1" "$INSTALL_DIR/$CMD_NAME"
  fi
  chmod +x "$INSTALL_DIR/$CMD_NAME" 2>/dev/null || sudo chmod +x "$INSTALL_DIR/$CMD_NAME"
}

HAS_DOCKER=0
HAS_DOWNLOAD=0
command -v docker > /dev/null 2>&1 && HAS_DOCKER=1
{ command -v curl > /dev/null 2>&1 || command -v wget > /dev/null 2>&1; } && HAS_DOWNLOAD=1

# Build the menu dynamically based on what's available

printf "\nHow do you want to install degoog-cli?\n\n"

OPTS=""
N=0

if [ "$HAS_DOCKER" = "1" ]; then
  N=$((N+1)); printf "  %s) Docker (recommended)\n" "$N"
  OPTS="${OPTS}docker "
fi

if [ "$HAS_DOWNLOAD" = "1" ]; then
  N=$((N+1)); printf "  %s) Native binary\n" "$N"
  OPTS="${OPTS}binary "
fi

if [ "$N" = "0" ]; then
  die "Docker is not installed and no download tool found. Install Docker from https://docs.docker.com/get-docker/ and try again."
fi

printf "\n"
printf "Choice [1]: "
read -r CHOICE < /dev/tty 2>/dev/null || CHOICE=""
CHOICE="${CHOICE:-1}"

METHOD=$(echo "$OPTS" | cut -d' ' -f"$CHOICE")
if [ -z "$METHOD" ]; then
  die "invalid choice"
fi

# Docker

if [ "$METHOD" = "docker" ]; then
  printf "Pulling image...\n"
  docker pull "$IMAGE"

  TMP="$(mktemp)"
  cat > "$TMP" <<EOF
#!/usr/bin/env sh
set -e
CONFIG_DIR="\$HOME/.config/degoog"
mkdir -p "\$CONFIG_DIR"
docker run --rm -it \\
  --user "\$(id -u):\$(id -g)" \\
  -e DEGOOG_CONFIG_HOME=/degoog-config \\
  -v "\$CONFIG_DIR:/degoog-config" \\
  -v "\$(pwd):/workspace" \\
  -w /workspace \\
  $IMAGE "\$@"
EOF

  install_to "$TMP"
  ok "installed degoog-cli (Docker) - run it from anywhere with: degoog-cli"
  exit 0
fi

# Binary

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  linux)
    case "$ARCH" in
      x86_64)  BINARY="degoog-cli-linux-x64" ;;
      aarch64) BINARY="degoog-cli-linux-arm64" ;;
      *) die "unsupported architecture: $ARCH" ;;
    esac
    ;;
  darwin)
    case "$ARCH" in
      x86_64)  BINARY="degoog-cli-darwin-x64" ;;
      arm64)   BINARY="degoog-cli-darwin-arm64" ;;
      *) die "unsupported architecture: $ARCH" ;;
    esac
    ;;
  *) die "unsupported OS: $OS - install Docker instead: https://docs.docker.com/get-docker/" ;;
esac

TMP="$(mktemp)"
printf "Downloading %s...\n" "$BINARY"

if command -v curl > /dev/null 2>&1; then
  curl -fsSL "$RELEASES/$BINARY" -o "$TMP"
else
  wget -qO "$TMP" "$RELEASES/$BINARY"
fi

install_to "$TMP"
ok "installed degoog-cli (binary) - run it from anywhere with: degoog-cli"
