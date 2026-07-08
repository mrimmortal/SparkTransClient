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
}: {
  viewport: FloatingActionViewport;
  size: FloatingActionSize;
  margin: number;
}): FloatingActionPosition {
  return clampFloatingActionPosition({
    position: {
      x: viewport.width - size.width - margin,
      y: viewport.height - size.height - margin,
    },
    viewport,
    size,
    margin,
  });
}

export function clampFloatingActionPosition({
  position,
  viewport,
  size,
  margin,
}: {
  position: FloatingActionPosition;
  viewport: FloatingActionViewport;
  size: FloatingActionSize;
  margin: number;
}): FloatingActionPosition {
  const maxX = Math.max(margin, viewport.width - size.width - margin);
  const maxY = Math.max(margin, viewport.height - size.height - margin);

  return {
    x: Math.min(Math.max(position.x, margin), maxX),
    y: Math.min(Math.max(position.y, margin), maxY),
  };
}
