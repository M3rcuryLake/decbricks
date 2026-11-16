#!/usr/bin/env bash
# Phase 1 Lighthouse battery v2: 6 routes x 3 passes, mobile, simulated throttling.
# Trace runs (--save-assets, home/terms p1) write to /tmp/opencode/lh-assets so the
# repo dir only ever holds the JSON reports; reports are copied back at the end.
cd /home/ankit/GitHub/decbricks || exit 1
mkdir -p docs/qa/perf-before /tmp/opencode/lh-assets
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4322/ || true)
  [ "$code" = "200" ] && break
  sleep 0.5
done
echo "server=$code start=$(date +%H:%M:%S)"
declare -A R=( [home]=/ [services]=/services [about]=/about [contact]=/contact [terms]=/terms [notfound]=/404 )
for pass in 1 2 3; do
  for name in home services about contact terms notfound; do
    url="http://localhost:4322${R[$name]}"
    extra=""; out="docs/qa/perf-before/$name-p$pass.json"
    if [ "$pass" = "1" ] && { [ "$name" = "home" ] || [ "$name" = "terms" ]; }; then
      extra="--save-assets"; out="/tmp/opencode/lh-assets/$name-p1.json"
    fi
    CHROME_PATH=/usr/bin/google-chrome npx -y lighthouse@12 "$url" --quiet \
      --output=json --output-path="$out" \
      --only-categories=performance,accessibility,best-practices,seo \
      --form-factor=mobile --screenEmulation.mobile \
      $extra \
      --chrome-flags="--headless=new --no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader" \
      > /tmp/opencode/lh-$name-p$pass.log 2>&1
    echo "done $name p$pass $(date +%H:%M:%S)"
  done
done
cp /tmp/opencode/lh-assets/home-p1.json /tmp/opencode/lh-assets/terms-p1.json docs/qa/perf-before/ 2>/dev/null
echo "ALL_DONE $(date +%H:%M:%S)"
