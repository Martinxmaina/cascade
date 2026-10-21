import { requireUser } from "@/lib/auth";
import { db, schema } from "@/db";
import { getCostPlusFloor, getMarkup, getPriceList, getPricingMode } from "@/lib/pricing";
import { PageHead } from "@/components/shell/PageHead";
import { SettingsView } from "@/components/shell/SettingsView";

export default async function Settings() {
  const user = await requireUser();
  return (
    <>
      <PageHead title="Settings" />
      <SettingsView
        admin={user.role === "admin"}
        prices={getPriceList()}
        mode={getPricingMode()}
        markup={getMarkup()}
        floor={getCostPlusFloor()}
        suppressions={db.select().from(schema.suppressions).all()}
      />
    </>
  );
}
