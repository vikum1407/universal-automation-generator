import { createTwoFilesPatch } from "diff";

export function generateUnifiedDiff(previous: string, current: string): string {
  if (!previous && !current) return "";

  const patch = createTwoFilesPatch(
    "previous",
    "current",
    previous ?? "",
    current ?? "",
    "",
    ""
  );

  return patch;
}
