#!/bin/sh
# Database backups, run by the "backup" container (docker-compose.prod.yml).
#
# Every BACKUP_EVERY_HOURS (default 24) it writes ./backups/crackit-<UTC time>.dump with
# pg_dump's custom format (compressed; restore with pg_restore, see docs/DEPLOYMENT.md) and
# keeps the newest BACKUP_KEEP files (default 7). One backup is taken as soon as the
# container starts, so every deploy also leaves a fresh copy.
#
# What is in it: everything in Postgres - accounts, resumes' parsed data, interviews and
# reports, prep stars and sets, and the LangGraph checkpoints (paused interviews).
# Not in it: uploaded resume files (./data/uploads) and Qdrant vectors. The question bank is
# rebuilt from knowledge_base/ at startup; resume vectors can be rebuilt with "reparse".
# These backups sit on the same VM: copy them off it too (docs/DEPLOYMENT.md, off-site copy).
set -eu

KEEP="${BACKUP_KEEP:-7}"
EVERY_SECONDS=$(( ${BACKUP_EVERY_HOURS:-24} * 3600 ))

backup() {
  name="crackit-$(date -u +%Y-%m-%dT%H%MZ).dump"
  # Write to a temporary name and rename at the end: a crash mid-dump never leaves a
  # half-written file that looks like a good backup.
  if pg_dump --format=custom --file="/backups/.$name.part"; then
    mv "/backups/.$name.part" "/backups/$name"
    echo "backup: wrote $name ($(du -h "/backups/$name" | cut -f1))"
  else
    rm -f "/backups/.$name.part"
    echo "backup: FAILED at $(date -u)" >&2
    return 1
  fi
  # Rotation: keep the newest $KEEP dumps (names sort by time).
  ls -1 /backups/crackit-*.dump 2>/dev/null | sort -r | tail -n +"$((KEEP + 1))" | while read -r old; do
    rm -f "$old" && echo "backup: removed old $(basename "$old")"
  done
}

while true; do
  backup || true   # a failed night must not stop the next one
  sleep "$EVERY_SECONDS"
done
