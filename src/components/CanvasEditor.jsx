import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import { triggerDownload } from "../utils/imageUtils";

const MAX_STAGE_WIDTH = 560;
const INITIAL_TRANSFORM = { nx: 0.5, ny: 0.5, scale: 1, rotation: 0 };

/**
 * Manual try-on: the person's photo with a garment on top that can be
 * dragged, resized and rotated (handles on the canvas, or sliders below).
 *
 * The garment's position is stored as fractions of the canvas (nx, ny) so it
 * keeps its place when the canvas resizes on different screen sizes.
 */
export default function CanvasEditor({ personSrc, garment }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const garmentRef = useRef(null);
  const transformerRef = useRef(null);

  const [personImg] = useImage(personSrc);
  const [garmentImg] = useImage(garment?.src);
  const [stageWidth, setStageWidth] = useState(MAX_STAGE_WIDTH);
  const [selected, setSelected] = useState(true);
  const [t, setT] = useState(INITIAL_TRANSFORM);

  // Keep the canvas as wide as its container (up to a maximum) so it fits phones.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setStageWidth(Math.min(el.clientWidth, MAX_STAGE_WIDTH));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Start fresh whenever a different garment is chosen.
  useEffect(() => {
    setT(INITIAL_TRANSFORM);
    setSelected(true);
  }, [garment?.src]);

  // Attach the transform handles to the garment while it is selected.
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    transformer.nodes(selected && garmentRef.current ? [garmentRef.current] : []);
    transformer.getLayer()?.batchDraw();
  }, [selected, garmentImg]);

  const stageHeight = personImg ? (stageWidth * personImg.height) / personImg.width : stageWidth;
  const baseWidth = stageWidth * (garment?.widthRatio ?? 0.4);
  const baseHeight = garmentImg ? (baseWidth * garmentImg.height) / garmentImg.width : baseWidth;

  function deselectOnBackgroundClick(event) {
    const clickedBackground = event.target === event.target.getStage() || event.target.name() === "person";
    if (clickedBackground) setSelected(false);
  }

  function handleDragEnd(event) {
    const node = event.target;
    setT((prev) => ({ ...prev, nx: node.x() / stageWidth, ny: node.y() / stageHeight }));
  }

  function handleTransformEnd() {
    const node = garmentRef.current;
    setT((prev) => ({
      ...prev,
      nx: node.x() / stageWidth,
      ny: node.y() / stageHeight,
      scale: node.scaleX(),
      rotation: node.rotation(),
    }));
  }

  function download() {
    const transformer = transformerRef.current;
    transformer.nodes([]); // hide the handles so they are not part of the image
    transformer.getLayer().batchDraw();

    // Export at roughly the original photo resolution (capped to keep files reasonable).
    const pixelRatio = Math.min(3, personImg.width / stageWidth);
    const url = stageRef.current.toDataURL({ pixelRatio, mimeType: "image/png" });

    if (selected && garmentRef.current) transformer.nodes([garmentRef.current]);
    triggerDownload(url, "virtual-try-on.png");
  }

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="flex justify-center rounded-lg bg-white p-2 shadow">
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          onMouseDown={deselectOnBackgroundClick}
          onTouchStart={deselectOnBackgroundClick}
          style={{ touchAction: "none" }}
        >
          <Layer>
            {personImg && (
              <KonvaImage image={personImg} name="person" x={0} y={0} width={stageWidth} height={stageHeight} />
            )}
            {garmentImg && (
              <KonvaImage
                ref={garmentRef}
                image={garmentImg}
                x={t.nx * stageWidth}
                y={t.ny * stageHeight}
                width={baseWidth}
                height={baseHeight}
                offsetX={baseWidth / 2}
                offsetY={baseHeight / 2}
                scaleX={t.scale}
                scaleY={t.scale}
                rotation={t.rotation}
                draggable
                onClick={() => setSelected(true)}
                onTap={() => setSelected(true)}
                onDragStart={() => setSelected(true)}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
              />
            )}
            <Transformer
              ref={transformerRef}
              keepRatio
              rotateEnabled
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
            />
          </Layer>
        </Stage>
      </div>

      <div className="grid gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-2">
        <label className="text-sm">
          Size
          <input
            type="range" min="0.2" max="3" step="0.01" value={t.scale}
            onChange={(e) => setT({ ...t, scale: Number(e.target.value) })}
            className="w-full"
          />
        </label>
        <label className="text-sm">
          Rotation ({Math.round(t.rotation)} deg)
          <input
            type="range" min="-180" max="180" step="1" value={t.rotation}
            onChange={(e) => setT({ ...t, rotation: Number(e.target.value) })}
            className="w-full"
          />
        </label>
        <button
          type="button"
          onClick={() => setT(INITIAL_TRANSFORM)}
          className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Reset position
        </button>
        <button
          type="button"
          onClick={download}
          disabled={!personImg}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Download image
        </button>
      </div>
    </div>
  );
}
