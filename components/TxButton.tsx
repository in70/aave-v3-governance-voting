export function TxButton({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone: 'for' | 'against';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn ${tone === 'for' ? 'btn-for' : 'btn-against'}`}>
      {children}
    </button>
  );
}
