export type UserRole = "member" | "admin" | "vp";

/** Roles that can use every administrative feature. */
export function isStaffRole(role: unknown): role is "admin" | "vp" {
  return role === "admin" || role === "vp";
}

export function roleLabel(role: UserRole) {
  if (role === "admin") return "หัวหน้าแก๊ง";
  if (role === "vp") return "VP";
  return "สมาชิก";
}
