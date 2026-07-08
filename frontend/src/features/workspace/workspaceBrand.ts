export type WorkspaceBrand = {
  name: string;
  subtitle: string;
  mark: string;
  ariaLabel: string;
};

export function getWorkspaceBrand(): WorkspaceBrand {
  return {
    name: "NEXT LINE",
    subtitle: "Spark",
    mark: "N",
    ariaLabel: "Next Line Spark clinical dictation workspace",
  };
}
