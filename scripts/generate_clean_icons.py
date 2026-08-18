import os
import zlib
import struct
import math

def create_png(width, height, draw_func):
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # Raw scanlines
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
            
    # IDAT
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = zlib.crc32(b'IDAT' + compressed) & 0xffffffff
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    # IEND
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return png

def draw_nor_icon(x, y, w, h):
    nx = (x / max(1, w - 1)) * 2.0 - 1.0
    ny = (y / max(1, h - 1)) * 2.0 - 1.0
    dist = math.sqrt(nx*nx + ny*ny)
    
    # Squircle boundary
    if abs(nx) > 0.65 and abs(ny) > 0.65:
        cx = abs(nx) - 0.65
        cy = abs(ny) - 0.65
        if math.sqrt(cx*cx + cy*cy) > 0.32:
            return (0, 0, 0, 0)
    elif max(abs(nx), abs(ny)) > 0.95:
        return (0, 0, 0, 0)
        
    bg_r, bg_g, bg_b = 15, 23, 42
    gold_r, gold_g, gold_b = 240, 185, 11
    
    is_gold = False
    # Outer ring accent
    if 0.84 <= dist <= 0.91:
        is_gold = True
        
    # 'N' Left column
    if -0.52 <= nx <= -0.28 and -0.55 <= ny <= 0.55:
        is_gold = True
    # 'N' Right column
    elif 0.28 <= nx <= 0.52 and -0.55 <= ny <= 0.55:
        is_gold = True
    # Diagonal connect
    else:
        target_y = 1.35 * nx
        if -0.38 <= nx <= 0.38 and abs(ny - target_y) <= 0.20:
            is_gold = True

    if is_gold:
        return (gold_r, gold_g, gold_b, 255)
    else:
        return (bg_r, bg_g, bg_b, 255)

def draw_placeholder(x, y, w, h):
    nx = (x / max(1, w - 1)) * 2.0 - 1.0
    ny = (y / max(1, h - 1)) * 2.0 - 1.0
    dist = math.sqrt(nx*nx + ny*ny)
    if dist > 0.95:
        return (0, 0, 0, 0)
    if dist < 0.6:
        return (240, 185, 11, 255)
    return (26, 32, 44, 255)

icons_to_generate = [
    ('android/app/src/main/res/mipmap-mdpi/ic_launcher.png', 48, 48, draw_nor_icon),
    ('android/app/src/main/res/mipmap-hdpi/ic_launcher.png', 72, 72, draw_nor_icon),
    ('android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', 96, 96, draw_nor_icon),
    ('android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', 144, 144, draw_nor_icon),
    ('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', 192, 192, draw_nor_icon),
    ('assets/images/placeholder.png', 128, 128, draw_placeholder),
]

for filepath, width, height, func in icons_to_generate:
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    png_bytes = create_png(width, height, func)
    with open(filepath, 'wb') as f:
        f.write(png_bytes)
    print(f'✅ Generated valid PNG {filepath}: {width}x{height}, size={len(png_bytes)} bytes, header={png_bytes[:8]}')
