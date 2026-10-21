import { PageHead } from "@/components/shell/PageHead";
import { EmptyState } from "@/components/shell/EmptyState";

export default function Page() {
  return (
    <>
      <PageHead title="Provider lab" />
      <EmptyState title="Nothing here yet" line="No bake-offs yet. Run the same leads through each provider alone and through the waterfall." />
    </>
  );
}
