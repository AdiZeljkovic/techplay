import { cookies } from "next/headers";
import { resolvePlanDate } from "./dates";

export const DATE_COOKIE = "gos_date";

/** The plan date for this request: the Settings override cookie, else today (Sarajevo), clamped to the plan. */
export async function getPlanDate() {
  const jar = await cookies();
  return resolvePlanDate(jar.get(DATE_COOKIE)?.value);
}
