import { redirect } from "next/navigation";

// Keep older bookmarks working: the member weapon registry now lives at /weapons.
export default function MembersPage() {
  redirect("/weapons");
}
