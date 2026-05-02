#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  EcoManage — Netlify build script
#
#  Copies Flask templates and static assets into dist/ as a plain static site.
#  All routing (clean URLs + API calls) is handled by netlify.toml redirects.
#  The API itself runs as a Netlify Function (netlify/functions/api.js).
#
#  No environment variables required at build time.
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "==> EcoManage Netlify build starting…"

# ── Create clean output directory ────────────────────────────────────────────
rm -rf dist
mkdir -p dist

# ── Copy static assets ────────────────────────────────────────────────────────
echo "==> Copying static assets…"
cp -r version1.2/static dist/static

# ── Copy and rename HTML templates ───────────────────────────────────────────
#    Flask route    →  Netlify file
#    /              →  dist/index.html       (landing page)
#    /dashboard     →  dist/dashboard.html
#    /login         →  dist/login.html
#    /manage        →  dist/manage.html
echo "==> Copying HTML templates…"
cp version1.2/templates/landing.html  dist/index.html
cp version1.2/templates/index.html    dist/dashboard.html
cp version1.2/templates/login.html    dist/login.html
cp version1.2/templates/manage.html   dist/manage.html

echo "==> Build complete. dist/ contents:"
ls -lh dist/
