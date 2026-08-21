#!/usr/bin/env bash
set -euo pipefail

WEBSITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${WEBSITE_DIR}/.." && pwd)"
SITE_DIR="${ROOT_DIR}/site"
LABEL_DIST="${ROOT_DIR}/apps/label/dist"
COMPARE_DIST="${ROOT_DIR}/apps/compare/dist"

if [[ ! -f "${LABEL_DIST}/index.html" ]]; then
	echo "Missing ${LABEL_DIST}/index.html. Build label first." >&2
	exit 1
fi
if [[ ! -f "${COMPARE_DIST}/index.html" ]]; then
	echo "Missing ${COMPARE_DIST}/index.html. Build compare first." >&2
	exit 1
fi

rm -rf "${SITE_DIR}"
mkdir -p "${SITE_DIR}/label" "${SITE_DIR}/compare"
cp "${WEBSITE_DIR}/index.html" "${SITE_DIR}/index.html"
cp -R "${LABEL_DIST}/." "${SITE_DIR}/label/"
cp -R "${COMPARE_DIST}/." "${SITE_DIR}/compare/"
cp "${SITE_DIR}/label/index.html" "${SITE_DIR}/label/404.html"
cp "${SITE_DIR}/compare/index.html" "${SITE_DIR}/compare/404.html"
