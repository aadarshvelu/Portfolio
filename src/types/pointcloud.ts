export interface PointCloudMeta {
  count: number;
  stride: number;
  fields: string[];
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
  center: [number, number, number];
}

export interface PointCloudData {
  positions: Float32Array; // [x, y, z] per particle
  sizes: Float32Array; // size per particle
  count: number;
  bounds: PointCloudMeta["bounds"];
  center: PointCloudMeta["center"];
}
