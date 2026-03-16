type TransitionHealingButtonProps = {
  onHeal: () => void;
};

export function TransitionHealingButton({ onHeal }: TransitionHealingButtonProps) {
  return (
    <button
      onClick={onHeal}
      className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
    >
      Heal Transitions
    </button>
  );
}
