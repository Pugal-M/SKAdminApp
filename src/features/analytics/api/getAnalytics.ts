import { supabase } from "../../../lib/supabase";
import { Database } from "../../../types/database.types";

export type DailyAnalytics = Database["public"]["Tables"]["daily_analytics_summary"]["Row"];

export async function getAnalytics(): Promise<DailyAnalytics[]> {
  const { data, error } = await supabase
    .from("daily_analytics_summary")
    .select("*")
    .order("summary_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as DailyAnalytics[];
}
