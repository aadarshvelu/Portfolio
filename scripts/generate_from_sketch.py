"""
Generate point cloud directly from a sketch image.
Particles are placed precisely on the dark lines of the sketch.

Usage:
    python generate_from_sketch.py --input sketch.png --output ../public/data/
    python generate_from_sketch.py --input sketch.png --output ../public/data/ --particles 80000 --threshold 40
"""

import argparse
import json
from pathlib import Path

import cv2
import numpy as np


def main():
    parser = argparse.ArgumentParser(description="Generate point cloud from a sketch image")
    parser.add_argument("--input", "-i", required=True, help="Path to sketch image (dark lines on white)")
    parser.add_argument("--output", "-o", required=True, help="Output directory for .bin and .meta.json")
    parser.add_argument("--particles", "-n", type=int, default=80000, help="Number of particles (default: 80000)")
    parser.add_argument("--threshold", "-t", type=int, default=40, help="Line detection threshold 0-255 (default: 40)")
    parser.add_argument("--jitter", type=float, default=0.3, help="Position jitter in pixels (default: 0.3)")
    parser.add_argument("--spatial-scale", type=float, default=0.01, help="Pixel-to-world-unit scale (default: 0.01)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    args = parser.parse_args()

    np.random.seed(args.seed)

    input_path = Path(args.input)
    output_dir = Path(args.output)

    if not input_path.exists():
        print(f"ERROR: Input file not found: {input_path}")
        return

    # Load sketch as grayscale
    sketch = cv2.imread(str(input_path), cv2.IMREAD_GRAYSCALE)
    if sketch is None:
        print(f"ERROR: Could not read image: {input_path}")
        return

    h, w = sketch.shape
    print(f"Loaded sketch: {w}x{h}")

    # Invert: dark lines become white (high values)
    inverted = 255 - sketch

    # Threshold to get clean line mask
    _, line_mask = cv2.threshold(inverted, args.threshold, 255, cv2.THRESH_BINARY)

    line_pixels = np.argwhere(line_mask > 0)  # [y, x]
    print(f"Found {len(line_pixels)} line pixels")

    if len(line_pixels) == 0:
        print("ERROR: No lines found. Try lowering --threshold.")
        return

    # Sample particles on line pixels
    indices = np.random.choice(len(line_pixels), size=args.particles, replace=True)
    py = line_pixels[indices, 0]
    px = line_pixels[indices, 1]

    # Tiny jitter so overlapping samples don't stack exactly
    px_f = px.astype(np.float32) + np.random.uniform(-args.jitter, args.jitter, args.particles).astype(np.float32)
    py_f = py.astype(np.float32) + np.random.uniform(-args.jitter, args.jitter, args.particles).astype(np.float32)

    # 3D coords (flat, z=0)
    x = (px_f - w / 2) * args.spatial_scale
    y = (h - py_f) * args.spatial_scale
    z = np.zeros(args.particles, dtype=np.float32)

    # Sizes: use line darkness for size variation
    darkness = inverted[py, px].astype(np.float32) / 255.0
    sizes = (0.5 + 0.5 * darkness) * np.random.uniform(0.85, 1.15, args.particles).astype(np.float32)

    # Normalized coords
    nx = px_f / w
    ny = py_f / h

    # Pack: [x, y, z, size, nx, ny]
    points = np.column_stack([x, y, z, sizes, nx, ny]).astype(np.float32)

    # Export
    output_dir.mkdir(parents=True, exist_ok=True)

    bin_path = output_dir / "pointcloud.bin"
    meta_path = output_dir / "pointcloud.meta.json"

    with open(bin_path, "wb") as f:
        f.write(points.tobytes())

    positions = points[:, :3]
    bounds_min = positions.min(axis=0).tolist()
    bounds_max = positions.max(axis=0).tolist()

    meta = {
        "count": args.particles,
        "stride": 6,
        "fields": ["x", "y", "z", "size", "nx", "ny"],
        "bounds": {"min": bounds_min, "max": bounds_max},
        "center": [(bounds_min[i] + bounds_max[i]) / 2 for i in range(3)],
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    bin_size_kb = bin_path.stat().st_size / 1024
    print(f"\nDone!")
    print(f"  Binary: {bin_path} ({bin_size_kb:.0f} KB)")
    print(f"  Meta:   {meta_path}")
    print(f"  Particles: {args.particles:,}")
    print(f"  Bounds X: [{bounds_min[0]:.2f}, {bounds_max[0]:.2f}]")
    print(f"  Bounds Y: [{bounds_min[1]:.2f}, {bounds_max[1]:.2f}]")


if __name__ == "__main__":
    main()
