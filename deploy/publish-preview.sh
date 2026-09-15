#!/usr/bin/env bash
# Publishes only this project's dist directory to the existing, isolated preview.
set -euo pipefail
cd "$(dirname "$0")/.."
preview_host=lingoai-studio
release_id="$(date -u +%Y%m%dT%H%M%SZ)-react"
staging_dir="$(mktemp -d "${TMPDIR:-/tmp}/lingoholon-react.XXXXXX")"
trap 'rm -rf "$staging_dir"' EXIT
npm run build
mkdir "$staging_dir/site"
cp -R dist/. "$staging_dir/site/"
cp deploy/Caddyfile.preview "$staging_dir/Caddyfile"
python3 - "$staging_dir" <<'PY'
from pathlib import Path
import hashlib, sys
root = Path(sys.argv[1])
files = sorted((root/'site').rglob('*')) + [root/'Caddyfile']
manifest = '\n'.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(root)}' for p in files if p.is_file())
(root/'SHA256SUMS').write_text(manifest+'\n')
PY
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$staging_dir/release.tar.gz" -C "$staging_dir" site Caddyfile SHA256SUMS
scp "$staging_dir/release.tar.gz" "$preview_host:/tmp/lingoholon-$release_id.tar.gz"
ssh "$preview_host" sudo bash -s -- "$release_id" <<'REMOTE'
set -euo pipefail
release_id="$1"
[[ "$release_id" =~ ^[0-9]{8}T[0-9]{6}Z-react$ ]]
root=/opt/lingoholon-preview
release_dir="$root/releases/$release_id"
name=lingoholon-preview
rollback_name="$name-rollback-$release_id"
[ "$(docker inspect "$name" --format '{{index .Config.Labels "app"}}')" = lingoholon-preview ]
image_id="$(cat "$root/image-id.txt")"
mkdir "$release_dir"
tar -xzf "/tmp/lingoholon-$release_id.tar.gz" -C "$release_dir" --no-same-owner --no-same-permissions
(cd "$release_dir" && sha256sum -c SHA256SUMS)
docker inspect "$name" > "$release_dir/previous-container.json"
readlink "$root/current" > "$release_dir/previous-release.txt"
run_preview() {
  local port_args=()
  if [ -n "$2" ]; then port_args=(-p 127.0.0.1:8088:8080); fi
  docker run -d --name "$1" --network lingoai-production_default \
    --label app=lingoholon-preview --label "release=$release_id" \
    --restart unless-stopped --read-only --user 1000:1000 \
    --memory 128m --cpus 0.5 --pids-limit 64 \
    --cap-drop ALL --cap-add NET_BIND_SERVICE --security-opt no-new-privileges \
    --tmpfs /config:rw,noexec,nosuid,size=4m,uid=1000,gid=1000 \
    --tmpfs /data:rw,noexec,nosuid,size=4m,uid=1000,gid=1000 \
    --mount "type=bind,src=$release_dir/site,dst=/srv,readonly" \
    --mount "type=bind,src=$release_dir/Caddyfile,dst=/etc/caddy/Caddyfile,readonly" \
    --health-cmd 'wget -q -O /dev/null http://127.0.0.1:8080/' \
    --health-interval 30s --health-timeout 3s --health-start-period 5s --health-retries 3 \
    "${port_args[@]}" "$image_id" > /dev/null
}
wait_ready() {
  for attempt in {1..15}; do
    if docker exec "$1" wget -q -O /dev/null http://127.0.0.1:8080/; then return 0; fi
    sleep 1
  done
  return 1
}
candidate="$name-candidate-$release_id"
run_preview "$candidate" ''
if ! wait_ready "$candidate"; then docker logs "$candidate"; docker rm -f "$candidate"; exit 1; fi
docker rm -f "$candidate" > /dev/null
docker stop "$name" > /dev/null
docker rename "$name" "$rollback_name"
if run_preview "$name" publish && wait_ready "$name"; then
  ln -sfn "$release_dir" "$root/current"
  printf 'Published %s\nRollback container (stopped): %s\n' "$release_id" "$rollback_name"
else
  docker logs "$name" || true
  docker rm -f "$name" || true
  docker rename "$rollback_name" "$name"
  docker start "$name" > /dev/null
  printf 'New release failed; previous preview restored.\n' >&2
  exit 1
fi
REMOTE
for preview_url in https://checkin.lingoai.io https://47.84.139.50; do
  curl -fsS --max-time 20 "$preview_url/" > "$staging_dir/live.html"
  cmp "$staging_dir/live.html" dist/index.html
  printf '\nVerified public HTML: %s/\n' "$preview_url"
done
