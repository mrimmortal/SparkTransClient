export type TemplatesLayoutCopy = {
  libraryTitle: string;
  editorTitle: string;
  previewTitle: string;
};

export function getTemplatesLayoutCopy(): TemplatesLayoutCopy {
  return {
    libraryTitle: "Template library",
    editorTitle: "Template definition",
    previewTitle: "Preview",
  };
}
