import { redirect } from "next/navigation";

// Legacy mock-data monitoring page deprecated in favor of the unified
// VORCE Device Intelligence Center. Redirect any inbound link.
export default function LegacyAssetsRedirect() {
  redirect("/admin/intelligence");
}
