export default function Button({
  children,
  onClick,
  disabled,
  style = {}
}: {
  children: any;
  onClick?: () => void;
  disabled?: boolean;
  style?: any;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 18px",
        borderRadius: "8px",
        background: "#7B2FF7",
        color: "white",
        border: "none",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "0.2s",
        ...style
      }}
    >
      {children}
    </button>
  );
}
