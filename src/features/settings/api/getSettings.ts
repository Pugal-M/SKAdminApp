import { supabase } from "../../../lib/supabase";
import { Database } from "../../../types/database.types";

export type SystemSetting = Database["public"]["Tables"]["system_settings"]["Row"];

export async function getSettings(): Promise<SystemSetting[]> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .order("category", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as SystemSetting[];
}
