#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  EcoManage — Netlify build script
#  Copies Flask templates + static assets into dist/ as a plain static site,
#  then generates a _redirects file that proxies all API calls to the backend.
#
#  Required Netlify environment variable:
#    ECOMANAGE_API_URL  →  e.g. https://ecomanage-api.onrender.com
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "==> EcoManage Netlify build starting…"

# ── Validate env var ──────────────────────────────────────────────────────────
if [ -z "$ECOMANAGE_API_URL" ]; then
  echo ""
  echo "  ERROR: ECOMANAGE_API_URL is not set."
  echo "  Set it in Netlify → Site → Environment variables."
  echo "  Example: https://ecomanage-api.onrender.com"
  echo ""
  exit 1
fi

# Strip trailing slash to keep redirect rules clean
API_URL="${ECOMANAGE_API_URL%/}"
echo "  Backend URL: $API_URL"

# ── Create output directory ───────────────────────────────────────────────────
rm -rf dist
mkdir -p dist

# ── Copy static assets ────────────────────────────────────────────────────────
echo "==> Copying static assets…"
cp -r version1.2/static dist/static

# ── Copy and rename HTML templates ───────────────────────────────────────────
#    Flask route         Netlify file
#    /                → dist/index.html        (landing page)
#    /dashboard        → dist/dashboard.html
#    /login            → dist/login.html
#    /manage           → dist/manage.html
echo "==> Copying HTML templates…"
cp version1.2/templates/landing.html  dist/index.html
cp version1.2/templates/index.html    dist/dashboard.html
cp version1.2/templates/login.html    dist/login.html
cp version1.2/templates/manage.html   dist/manage.html

# ── Generate _redirects ───────────────────────────────────────────────────────
#    1. Clean URL rewrites (so /dashboard loads dashboard.html without the .html)
#    2. API proxy rules  (so fetch('/api/…') on the frontend is silently
#       forwarded to the Flask backend on Render/Railway)
echo "==> Generating _redirects…"
cat > dist/_redirects << REDIRECTS
# ── Clean URL rewrites ────────────────────────────────────────
/dashboard      /dashboard.html     200
/login          /login.html         200
/manage         /manage.html        200
/add-building   /manage.html        200

# ── API proxy → Flask backend ─────────────────────────────────
# All API requests from the browser are transparently forwarded
# to the deployed Flask backend so frontend JS needs no changes.
/api/*          ${API_URL}/api/:splat          200
/buildings      ${API_URL}/buildings           200
/buildings/*    ${API_URL}/buildings/:splat    200
/data/*         ${API_URL}/data/:splat         200

# ── 404 fallback ──────────────────────────────────────────────
/*              /index.html                    404
REDIRECTS

echo "==> Build complete. Output in dist/"
ls -lh dist/
