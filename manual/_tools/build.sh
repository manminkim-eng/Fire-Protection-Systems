#!/bin/bash
# 소방시설 설치 검토 매뉴얼 전체 재생성: 캡처 → WebP → HTML → PDF → 좁은 화면 점검   usage: LANG=ko_KR.UTF-8 bash build.sh <repoDir> <rawDir>
set -e; REPO="$(cd "$1" && pwd)"; RAW="$2"; mkdir -p "$RAW"; RAW="$(cd "$RAW" && pwd)"; cd "$(dirname "$0")"; M="$REPO/manual"; mkdir -p "$M/images"
node capture_fp.js "$REPO" "$RAW" > "$RAW/_log.json"
cp "$RAW/_example.json" ./_example.json
python3 - "$RAW" "$M" <<'PY'
import sys,glob,os,shutil
from PIL import Image
raw,M=sys.argv[1],sys.argv[2]
for f in sorted(glob.glob(raw+'/s*.png')):
    Image.open(f).convert('RGB').save(M+'/images/'+os.path.basename(f)[:-4]+'.webp',quality=82,method=6)
shutil.copy(raw+'/_marks.json',M+'/images/_marks.json')
PY
MANUAL_DIR="$M" python3 gen_manual_fp.py
node pdf_fp.js "$M" 소방시설설치검토시스템_사용자매뉴얼_Ver-5.2.pdf "소방시설 설치 검토 시스템 사용자 매뉴얼 Ver-5.2"
node audit_responsive.js "$M/index.html" > "$RAW/_audit.json"
