#!/bin/sh
echo "=== STARTUP: server.js ==="
if [ -f backend/src/server.js ]; then
  cat backend/src/server.js
else
  echo "(server.js not found)"
fi
echo "=== STARTUP: db.js ==="
if [ -f backend/src/db.js ]; then
  cat backend/src/db.js
else
  echo "(db.js not found)"
fi
echo "=== STARTUP: ENV ==="
env
echo "=== STARTING NODE ==="
exec node backend/src/server.js
