import React from "react";
import AssetModel from "./AssetModel";
import { ASSET_URLS } from "./config/sceneConfig";
import { useLayout } from "./layoutContext";

/**
 * Pen — pen.glb, left resting diagonally across the lower-right of the note,
 * as if someone just finished writing and set it down. Placement comes entirely
 * from SCENE_CONFIG.pen; it casts a shadow onto the paper and desk.
 *
 * It is positioned just above the paper surface (and tilted to match the paper)
 * so it never sinks into or clips through the sheet.
 */
export default function Pen() {
  const { pen } = useLayout();
  return <AssetModel name="PEN" url={ASSET_URLS.pen} config={pen} />;
}
