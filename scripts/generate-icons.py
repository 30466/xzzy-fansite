#!/usr/bin/env python3
"""从 bg.jpg 生成 PWA 图标（中心裁切 → 缩放）

用法: python3 scripts/generate-icons.py
依赖: pip3 install Pillow
"""
from PIL import Image
import os, sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
BG_PATH = os.path.join(PROJECT_DIR, 'public', 'bg.jpg')
OUT_DIR = os.path.join(PROJECT_DIR, 'public')

SIZES = [192, 512]

if not os.path.exists(BG_PATH):
    print(f'❌ 找不到 {BG_PATH}')
    sys.exit(1)

bg = Image.open(BG_PATH).convert('RGB')
w, h = bg.size
crop_size = min(w, h)
left = (w - crop_size) // 2
top = (h - crop_size) // 2
cropped = bg.crop((left, top, left + crop_size, top + crop_size))

for size in SIZES:
    icon = cropped.resize((size, size), Image.LANCZOS)
    path = os.path.join(OUT_DIR, f'icon-{size}.png')
    icon.save(path, 'PNG')
    print(f'✅ icon-{size}.png  {os.path.getsize(path):,} bytes')

print('Done!')
