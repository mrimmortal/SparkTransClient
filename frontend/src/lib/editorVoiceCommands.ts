export type TextblockDeleteRange = {
  fromOffset: number;
  toOffset: number;
};

export function getDeleteLastWordRange(text: string, cursorOffset: number): TextblockDeleteRange | null {
  const beforeCursor = text.slice(0, cursorOffset);
  const match = /(\S+)\s*$/.exec(beforeCursor);
  if (!match || match.index === undefined) return null;
  return { fromOffset: match.index, toOffset: cursorOffset };
}

export function getDeleteLastSentenceRange(text: string, cursorOffset: number): TextblockDeleteRange | null {
  const beforeCursor = text.slice(0, cursorOffset);
  if (!beforeCursor.trim()) return null;
  const trimmedEnd = findTrimmedEnd(beforeCursor);
  const boundary = Math.max(
    beforeCursor.lastIndexOf(".", trimmedEnd - 1),
    beforeCursor.lastIndexOf("?", trimmedEnd - 1),
    beforeCursor.lastIndexOf("!", trimmedEnd - 1),
  );
  const fromOffset = boundary >= 0 ? skipWhitespaceForward(beforeCursor, boundary + 1) : 0;
  return { fromOffset, toOffset: cursorOffset };
}

function findTrimmedEnd(value: string): number {
  for (let index = value.length - 1; index >= 0; index -= 1) {
    if (!/\s/.test(value[index])) return index + 1;
  }
  return 0;
}

function skipWhitespaceForward(value: string, offset: number): number {
  let nextOffset = offset;
  while (nextOffset < value.length && /\s/.test(value[nextOffset])) {
    nextOffset += 1;
  }
  return nextOffset;
}
