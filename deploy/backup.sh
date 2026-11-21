#!/bin/sh
# Backups, run by the "backup" container (docker-compose.prod.yml).
#
# Every BACKUP_EVERY_HOURS (default 24) it writes, into ./backups:
#   crackit-<UTC time>.dump          the database (pg_dump custom format; restore with
#                                    pg_restore, see docs/DEPLOYMENT.md)
#   crackit-<UTC time>-uploads.tgz   the uploaded resume files (./data/uploads)
# and keeps the newest BACKUP_KEEP of each (default 7). One backup is taken as soon as the
# container starts, so every deploy also leaves a fresh copy.
#
# The database has accounts, resumes' parsed data, interviews and reports, prep data,
# feedback and the LangGraph checkpoints (paused interviews). The uploads used to be left
# out (audit, Nov 2026): losing the disk would have lost every resume file while the
# database still pointed to them. Not backed up: Qdrant vectors (the question bank is
# rebuilt from knowledge_base/ at startup; resume vectors can be rebuilt with "reparse").
# These backups sit on the same VM: copy them off it too (docs/DEPLOYMENT.md, off-site copy).
set -eu

KEEP="${BACKUP_KEEP:-7}"
EVERY_SECONDS=$(( ${BACKUP_EVERY_HOURS:-24} * 3600 ))

rotate() {  # rotate <pattern>: keep the newest $KEEP files matching it (names sort by time)
  ls -1 /backups/$1 2>/dev/null | sort -r | tail -n +"$((KEEP + 1))" | while read -r old; do
    rm -f "$old" && echo "backup: removed old $(basename "$old")"
  done
}

backup() {
  stamp="$(date -u +%Y-%m-%dT%H%MZ)"
  name="crackit-$stamp.dump"
  # Write to a temporary name and rename at the end: a crash mid-dump never leaves a
  # half-written file that looks like a good backup.
  if pg_dump --format=custom --file="/backups/.$name.part"; then
    mv "/backups/.$name.part" "/backups/$name"
    echo "backup: wrote $name ($(du -h "/backups/$name" | cut -f1))"
  else
    rm -f "/backups/.$name.part"
    echo "backup: database FAILED at $(date -u)" >&2
    return 1
  fi
  rotate "crackit-*.dump"

  if [ -d /uploads ]; then
    files="crackit-$stamp-uploads.tgz"
    if tar -czf "/backups/.$files.part" -C /uploads .; then
      mv "/backups/.$files.part" "/backups/$files"
      echo "backup: wrote $files ($(du -h "/backups/$files" | cut -f1))"
    else
      rm -f "/backups/.$files.part"
      echo "backup: uploads FAILED at $(date -u)" >&2
    fi
    rotate "crackit-*-uploads.tgz"
  fi
}

while true; do
  backup || true   # a failed night must not stop the next one
  sleep "$EVERY_SECONDS"
done
