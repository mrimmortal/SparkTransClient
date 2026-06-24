import { ShortcutBindingRecord } from "../../lib/api";

export function stripShortcutId(shortcut: ShortcutBindingRecord): Omit<ShortcutBindingRecord, "id"> {
  return {
    action: shortcut.action,
    shortcut: shortcut.shortcut,
    description: shortcut.description,
  };
}

export function updateShortcut(
  shortcuts: Omit<ShortcutBindingRecord, "id">[],
  index: number,
  payload: Partial<Omit<ShortcutBindingRecord, "id">>,
) {
  return shortcuts.map((shortcut, itemIndex) => (itemIndex === index ? { ...shortcut, ...payload } : shortcut));
}
