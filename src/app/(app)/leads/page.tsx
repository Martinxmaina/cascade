import { PageHead } from "@/components/shell/PageHead";
import { EmptyState } from "@/components/shell/EmptyState";

export default function Page() {
  return (
    <>
      <PageHead title="Leads" />
      <EmptyState title="Nothing here yet" line="No runs yet. Describe your business and Cascade finds the people who buy it." />
    </>
  );
}
