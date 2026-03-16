interface SeverityBadgeProps {
  impact: 'high' | 'medium' | 'low';
}

export function SeverityBadge({ impact }: SeverityBadgeProps) {
  const styles = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-orange-100 text-orange-700 border-orange-300',
    low: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold rounded border ${styles[impact]}`}
    >
      {impact.toUpperCase()}
    </span>
  );
}
