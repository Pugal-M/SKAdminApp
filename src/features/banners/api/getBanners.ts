import { supabase } from "../../../lib/supabase";
import { Database } from "../../../types/database.types";

export type Banner = Database["public"]["Tables"]["banners"]["Row"];

export async function getBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Banner[];
}
