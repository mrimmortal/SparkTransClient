export type FloatingActionPosition = {
  x: number;
  y: number;
};

export type FloatingActionSize = {
  width: number;
  height: number;
};

export type FloatingActionViewport = FloatingActionSize;

export function buildFloatingActionClassName({
  disabled,
  recording,
}: {
  disabled: boolean;
  recording: boolean;
}): string {
  return [
    "primary",
    "floating-transcription-action",
    disabled ? "disabled" : null,
    recording ? "recording" : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function getDefaultFloatingActionPosition({
  viewport,
  size,
  margin,
  reservedLeft = 0,
}: {
  viewport: FloatingActionViewport;
  size: FloatingActionSize;
  margin: number;
  reservedLeft?: number;
}): FloatingActionPosition {
  const leftBoundary = Math.max(0, reservedLeft);
  return clampFloatingActionPosition({
    position: {
      x: viewport.width - size.width - margin,
      y: viewport.height - size.height - margin,
    },
    viewport,
    size,
    margin,
    reservedLeft: leftBoundary,
  });
}

export function clampFloatingActionPosition({
  position,
  viewport,
  size,
  margin,
  reservedLeft = 0,
}: {
  position: FloatingActionPosition;
  viewport: FloatingActionViewport;
  size: FloatingActionSize;
  margin: number;
  reservedLeft?: number;
}): FloatingActionPosition {
  const minX = Math.min(Math.max(margin, reservedLeft + margin), Math.max(margin, viewport.width - size.width - margin));
  const maxX = Math.max(margin, viewport.width - size.width - margin);
  const maxY = Math.max(margin, viewport.height - size.height - margin);

  return {
    x: Math.min(Math.max(position.x, minX), maxX),
    y: Math.min(Math.max(position.y, margin), maxY),
  };
}
