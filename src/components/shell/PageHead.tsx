export function PageHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2>{title}</h2>
      {sub && <p className="muted" style={{ marginTop: 6 }}>{sub}</p>}
    </div>
  );
}
