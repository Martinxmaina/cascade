import { PageHead } from "@/components/shell/PageHead";
import { EmptyState } from "@/components/shell/EmptyState";

export default function Page() {
  return (
    <>
      <PageHead title="Clean a list" />
      <EmptyState title="Nothing here yet" line="No lists yet. Import a CSV and Cascade verifies, refinds or enriches it." />
    </>
  );
}
