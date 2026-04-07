"""
2D Photo → 3D Point Cloud Generator

Pipeline:
1. Background removal (rembg / U2-Net)
2. Depth estimation (Depth Anything V2 Small)
3. Edge-weighted sampling (~50k particles)
4. Binary export for Three.js consumption

Usage:
    python generate_pointcloud.py --input photo.jpg --output ../public/data/
    python generate_pointcloud.py --input photo.jpg --output ../public/data/ --particles 50000 --depth-scale 2.5
"""

import argparse
import json
import struct
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from rembg import remove


def remove_background(image: Image.Image) -> Image.Image:
    """Remove background using rembg (U2-Net), returns RGBA image."""
    print("[1/5] Removing background...")
    result = remove(image)
    return result.convert("RGBA")


def estimate_depth(image: Image.Image) -> np.ndarray:
    """Estimate depth using Depth Anything V2 Small via HuggingFace pipeline."""
    print("[2/5] Estimating depth (this may take a moment on first run)...")
    from transformers import pipeline

    depth_pipe = pipeline(
        "depth-estimation",
        model="depth-anything/Depth-Anything-V2-Small-hf",
        device="cpu",
    )
    result = depth_pipe(image)
    depth_map = np.array(result["depth"])

    # Normalize to 0-1 range
    d_min, d_max = depth_map.min(), depth_map.max()
    if d_max - d_min > 0:
        depth_map = (depth_map - d_min) / (d_max - d_min)
    else:
        depth_map = np.zeros_like(depth_map, dtype=np.float32)

    return depth_map.astype(np.float32)


def compute_edge_weights(image: Image.Image, alpha_mask: np.ndarray, edges_only: bool = False, edge_thickness: int = 3) -> np.ndarray:
    """Compute edge-weighted sampling probability map using Canny edge detection."""
    print("[3/5] Computing edge map (Canny + silhouette contour)...")
    import cv2
    from scipy.ndimage import maximum_filter

    gray = np.array(image.convert("L"))

    # --- Canny edge detection on the image (crisp single-pixel edges) ---
    # Apply slight Gaussian blur first for cleaner edges
    blurred = cv2.GaussianBlur(gray, (3, 3), 0.8)
    canny_edges = cv2.Canny(blurred, 50, 150).astype(np.float64) / 255.0

    # --- Silhouette contour from alpha mask boundary ---
    alpha_u8 = (alpha_mask * 255).astype(np.uint8)
    alpha_canny = cv2.Canny(alpha_u8, 50, 150).astype(np.float64) / 255.0

    # Combine: internal detail edges + silhouette outline
    combined_edges = np.maximum(canny_edges, alpha_canny)

    # Dilate edges to give them thickness (particle band width)
    dilated_edges = maximum_filter(combined_edges, size=edge_thickness)

    # Mask to only include pixels within the subject
    dilated_edges = dilated_edges * alpha_mask

    # Normalize
    e_max = dilated_edges.max()
    if e_max > 0:
        dilated_edges = dilated_edges / e_max

    if edges_only:
        # Only edge band
        probability = dilated_edges
    else:
        # Fill body but heavily weight edges
        probability = alpha_mask * (0.15 + 0.85 * dilated_edges)

    return probability.astype(np.float64), dilated_edges


def sample_points(
    image: Image.Image,
    masked: Image.Image,
    depth_map: np.ndarray,
    probability: np.ndarray,
    edge_map: np.ndarray,
    num_particles: int,
    depth_scale: float,
    spatial_scale: float,
) -> np.ndarray:
    """Sample weighted points and construct 3D coordinates."""
    print(f"[4/5] Sampling {num_particles:,} particles...")

    width, height = image.size

    # Flatten probability map and normalize to sum to 1
    prob_flat = probability.flatten()
    prob_sum = prob_flat.sum()
    if prob_sum == 0:
        print("ERROR: No valid pixels found after masking. Check your input image.")
        sys.exit(1)
    prob_flat = prob_flat / prob_sum

    # Resize depth map to match image dimensions if needed
    if depth_map.shape != (height, width):
        from PIL import Image as PILImage

        depth_pil = PILImage.fromarray((depth_map * 255).astype(np.uint8))
        depth_pil = depth_pil.resize((width, height), PILImage.BILINEAR)
        depth_map = np.array(depth_pil).astype(np.float32) / 255.0

    # Sample pixel indices weighted by probability
    indices = np.random.choice(len(prob_flat), size=num_particles, replace=True, p=prob_flat)
    py = indices // width
    px = indices % width

    # Get RGBA pixels from masked image
    masked_arr = np.array(masked)

    # Construct 3D coordinates
    # x: centered horizontally
    x = (px.astype(np.float32) - width / 2) * spatial_scale
    # y: bottom-anchored (y=0 at bottom of image, positive going up)
    y = (height - py.astype(np.float32)) * spatial_scale
    # z: from depth estimation
    z = depth_map[py, px] * depth_scale

    # Particle sizes: edge particles are large, interior particles are tiny
    edge_intensity = edge_map[py, px].astype(np.float32)
    # Edge particles: size 0.8-1.2, Interior particles: size 0.15-0.3
    sizes = (0.15 + edge_intensity * 0.85) * np.random.uniform(0.85, 1.15, size=num_particles).astype(np.float32)

    # Normalized original coords (for potential future use)
    nx = px.astype(np.float32) / width
    ny = py.astype(np.float32) / height

    # Stack into stride-6 array: [x, y, z, size, nx, ny]
    points = np.column_stack([x, y, z, sizes, nx, ny]).astype(np.float32)

    return points


def export_binary(points: np.ndarray, output_dir: Path):
    """Export point cloud as binary Float32Array and metadata JSON."""
    print("[5/5] Exporting binary data...")

    output_dir.mkdir(parents=True, exist_ok=True)

    bin_path = output_dir / "pointcloud.bin"
    meta_path = output_dir / "pointcloud.meta.json"

    # Write binary
    with open(bin_path, "wb") as f:
        f.write(points.tobytes())

    # Compute bounds
    positions = points[:, :3]
    bounds_min = positions.min(axis=0).tolist()
    bounds_max = positions.max(axis=0).tolist()

    # Write metadata
    meta = {
        "count": len(points),
        "stride": 6,
        "fields": ["x", "y", "z", "size", "nx", "ny"],
        "bounds": {
            "min": bounds_min,
            "max": bounds_max,
        },
        "center": [
            (bounds_min[0] + bounds_max[0]) / 2,
            (bounds_min[1] + bounds_max[1]) / 2,
            (bounds_min[2] + bounds_max[2]) / 2,
        ],
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    bin_size_kb = bin_path.stat().st_size / 1024
    print(f"\nDone!")
    print(f"  Binary: {bin_path} ({bin_size_kb:.0f} KB)")
    print(f"  Meta:   {meta_path}")
    print(f"  Particles: {meta['count']:,}")
    print(f"  Bounds X: [{bounds_min[0]:.2f}, {bounds_max[0]:.2f}]")
    print(f"  Bounds Y: [{bounds_min[1]:.2f}, {bounds_max[1]:.2f}]")
    print(f"  Bounds Z: [{bounds_min[2]:.2f}, {bounds_max[2]:.2f}]")


def main():
    parser = argparse.ArgumentParser(description="Generate 3D point cloud from a 2D photo")
    parser.add_argument("--input", "-i", required=True, help="Path to input photo")
    parser.add_argument("--output", "-o", required=True, help="Output directory for .bin and .meta.json")
    parser.add_argument("--particles", "-n", type=int, default=50000, help="Number of particles (default: 50000)")
    parser.add_argument("--depth-scale", type=float, default=2.5, help="Depth exaggeration factor (default: 2.5)")
    parser.add_argument("--spatial-scale", type=float, default=0.01, help="Pixel-to-world-unit scale (default: 0.01)")
    parser.add_argument("--edges-only", action="store_true", help="Only sample particles along edges/contours")
    parser.add_argument("--edge-image", type=str, default=None, help="Path to a pre-generated edge map image (white edges on black). Particles placed precisely on these edges.")
    parser.add_argument("--edge-thickness", type=int, default=3, help="Edge band thickness in pixels (default: 3)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    args = parser.parse_args()

    np.random.seed(args.seed)

    input_path = Path(args.input)
    output_dir = Path(args.output)

    if not input_path.exists():
        print(f"ERROR: Input file not found: {input_path}")
        sys.exit(1)

    # Load image
    image = Image.open(input_path).convert("RGB")
    print(f"Loaded image: {image.size[0]}x{image.size[1]}")

    # Step 1: Remove background
    masked = remove_background(image)
    alpha_mask = np.array(masked)[:, :, 3].astype(np.float64) / 255.0

    # Step 2: Estimate depth
    depth_map = estimate_depth(image)

    # Step 3: Compute sampling probability
    if args.edge_image:
        import cv2
        print(f"[3/5] Using pre-generated edge image: {args.edge_image}")
        edge_img = cv2.imread(args.edge_image, cv2.IMREAD_GRAYSCALE)
        if edge_img is None:
            print(f"ERROR: Could not load edge image: {args.edge_image}")
            sys.exit(1)
        # Resize edge image to match input if needed
        h, w = alpha_mask.shape
        if edge_img.shape != (h, w):
            edge_img = cv2.resize(edge_img, (w, h), interpolation=cv2.INTER_NEAREST)
        # Dilate for particle band width
        kernel = np.ones((args.edge_thickness, args.edge_thickness), np.uint8)
        edge_img = cv2.dilate(edge_img, kernel, iterations=1)
        # Use edge pixels within alpha mask as probability
        edge_map = (edge_img.astype(np.float64) / 255.0) * alpha_mask
        probability = edge_map
    else:
        probability, edge_map = compute_edge_weights(image, alpha_mask, edges_only=args.edges_only, edge_thickness=args.edge_thickness)

    # Step 4: Sample particles
    points = sample_points(
        image=image,
        masked=masked,
        depth_map=depth_map,
        probability=probability,
        edge_map=edge_map,
        num_particles=args.particles,
        depth_scale=args.depth_scale,
        spatial_scale=args.spatial_scale,
    )

    # Step 5: Export
    export_binary(points, output_dir)


if __name__ == "__main__":
    main()
