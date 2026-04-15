#!/bin/bash
# Clone production Firestore data into staging.
#
# Requirements:
#   - gcloud CLI installed and authenticated (`gcloud auth login`)
#   - gsutil available (comes with gcloud)
#   - Your gcloud account must have roles on both projects:
#       - roles/datastore.importExportAdmin  (on both projects)
#       - roles/storage.admin                (on both projects)
#
# Usage:
#   ./scripts/clone-prod-to-staging.sh
#   ./scripts/clone-prod-to-staging.sh --collections events,staff   # specific collections only

set -euo pipefail

PROD_PROJECT="music-runbook-prod"
STAGING_PROJECT="music-runbook"

PROD_BUCKET="gs://${PROD_PROJECT}.firebasestorage.app"
STAGING_BUCKET="gs://${STAGING_PROJECT}.firebasestorage.app"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_DIR="firestore-clone/${TIMESTAMP}"

# Optional: filter to specific collections
COLLECTION_IDS_FLAG=""
if [[ "${1:-}" == "--collections" && -n "${2:-}" ]]; then
  IFS=',' read -ra COLS <<< "$2"
  COLLECTION_IDS_FLAG="--collection-ids=$(IFS=','; echo "${COLS[*]}")"
  echo "==> Filtering to collections: $2"
fi

echo ""
echo "==> Cloning Firestore: $PROD_PROJECT --> $STAGING_PROJECT"
echo "    Timestamp: $TIMESTAMP"
echo ""

# ── Step 1: Export prod ──────────────────────────────────────────────────────
echo "[1/4] Exporting production Firestore to $PROD_BUCKET/$EXPORT_DIR ..."
# shellcheck disable=SC2086
gcloud firestore export "${PROD_BUCKET}/${EXPORT_DIR}" \
  --project="${PROD_PROJECT}" \
  ${COLLECTION_IDS_FLAG}

echo "      Export complete."

# ── Step 2: Copy export to staging bucket ────────────────────────────────────
echo "[2/4] Copying export to staging bucket $STAGING_BUCKET/$EXPORT_DIR ..."
gsutil -m cp -r "${PROD_BUCKET}/${EXPORT_DIR}" "${STAGING_BUCKET}/firestore-clone/"
echo "      Copy complete."

# ── Step 3: Import into staging ──────────────────────────────────────────────
echo "[3/4] Importing into staging Firestore ($STAGING_PROJECT) ..."
# shellcheck disable=SC2086
gcloud firestore import "${STAGING_BUCKET}/${EXPORT_DIR}" \
  --project="${STAGING_PROJECT}" \
  ${COLLECTION_IDS_FLAG}

echo "      Import complete."

# ── Step 4: Cleanup ──────────────────────────────────────────────────────────
echo "[4/4] Cleaning up temporary export files ..."
gsutil -m rm -r "${PROD_BUCKET}/${EXPORT_DIR}"
gsutil -m rm -r "${STAGING_BUCKET}/${EXPORT_DIR}"
echo "      Cleanup complete."

echo ""
echo "Done! Production data has been cloned into staging ($STAGING_PROJECT)."
echo ""
