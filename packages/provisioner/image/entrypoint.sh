#!/usr/bin/env bash
set -euo pipefail

USER_NAME="user"
USER_HOME="/home/$USER_NAME"
SSH_DIR="$USER_HOME/.ssh"
AUTHORIZED_KEYS="$SSH_DIR/authorized_keys"

mkdir -p "$SSH_DIR"
chown "$USER_NAME":"$USER_NAME" "$SSH_DIR"
chmod 700 "$SSH_DIR"

if [ -n "${SSH_PUBLIC_KEY:-}" ]; then
  echo "$SSH_PUBLIC_KEY" > "$AUTHORIZED_KEYS"
  chown "$USER_NAME":"$USER_NAME" "$AUTHORIZED_KEYS"
  chmod 600 "$AUTHORIZED_KEYS"
else
  echo "WARNING: SSH_PUBLIC_KEY not set; SSH key auth will fail" >&2
fi

mkdir -p /var/run/sshd
chmod 755 /var/run/sshd

exec /usr/sbin/sshd -D
