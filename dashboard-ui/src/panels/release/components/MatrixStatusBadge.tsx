export default function MatrixStatusBadge({
  status,
}: {
  status: "stable" | "unstable" | "risky" | "flaky";
}) {
  const color =
    status === "stable"
      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
      : status === "unstable"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"
      : status === "flaky"
      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200"
      : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";

  const label =
    status === "stable"
      ? "Stable"
      : status === "unstable"
      ? "Unstable"
      : status === "flaky"
      ? "Flaky"
      : "Risky";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}
