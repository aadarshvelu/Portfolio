import type { PointCloudData, PointCloudMeta } from "@/types/pointcloud";

export async function loadPointCloud(basePath: string): Promise<PointCloudData> {
  const [binResponse, metaResponse] = await Promise.all([
    fetch(`${basePath}/pointcloud.bin`),
    fetch(`${basePath}/pointcloud.meta.json`),
  ]);

  if (!binResponse.ok || !metaResponse.ok) {
    throw new Error("Failed to load point cloud data");
  }

  const [buffer, meta] = await Promise.all([
    binResponse.arrayBuffer(),
    metaResponse.json() as Promise<PointCloudMeta>,
  ]);

  const raw = new Float32Array(buffer);
  const { count, stride } = meta;

  // Extract positions (x, y, z) and sizes from stride-6 layout
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const offset = i * stride;
    positions[i * 3] = raw[offset]; // x
    positions[i * 3 + 1] = raw[offset + 1]; // y
    positions[i * 3 + 2] = raw[offset + 2]; // z
    sizes[i] = raw[offset + 3]; // size
  }

  return {
    positions,
    sizes,
    count,
    bounds: meta.bounds,
    center: meta.center,
  };
}
