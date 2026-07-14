export type TextblockDeleteRange = {
  fromOffset: number;
  toOffset: number;
};

export function findSentenceRanges(text: string): TextblockDeleteRange[] {
  const ranges: TextblockDeleteRange[] = [];
  let sentenceStart = skipWhitespaceForward(text, 0);

  for (let index = sentenceStart; index < text.length; index += 1) {
    if (!/[.!?]/.test(text[index])) continue;
    ranges.push({ fromOffset: sentenceStart, toOffset: index + 1 });
    sentenceStart = skipWhitespaceForward(text, index + 1);
  }

  const trimmedEnd = findTrimmedEnd(text);
  if (sentenceStart < trimmedEnd) {
    ranges.push({ fromOffset: sentenceStart, toOffset: trimmedEnd });
  }

  return ranges;
}

export function getDeleteLastWordRange(text: string, cursorOffset: number): TextblockDeleteRange | null {
  const beforeCursor = text.slice(0, cursorOffset);
  const match = /(\S+)\s*$/.exec(beforeCursor);
  if (!match || match.index === undefined) return null;
  return { fromOffset: match.index, toOffset: cursorOffset };
}

export function getDeleteLastSentenceRange(text: string, cursorOffset: number): TextblockDeleteRange | null {
  const beforeCursor = text.slice(0, cursorOffset);
  if (!beforeCursor.trim()) return null;
  const sentences = findSentenceRanges(beforeCursor);
  if (!sentences.length) return null;
  const previousSentence = sentences[sentences.length - 1];
  return { fromOffset: previousSentence.fromOffset, toOffset: cursorOffset };
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
