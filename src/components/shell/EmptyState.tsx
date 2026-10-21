import { Wash } from "@/components/watercolour/Watercolour";

export function EmptyState({ title, line, action }: { title: string; line: string; action?: React.ReactNode }) {
  return (
    <div className="card empty">
      <Wash style={{ width: 420, top: -90, left: "50%", marginLeft: -210 }} tone={100} seed={5} />
      <h3 style={{ position: "relative" }}>{title}</h3>
      <p>{line}</p>
      {action}
    </div>
  );
}
