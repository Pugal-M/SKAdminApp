import { supabase } from "../../../lib/supabase";
import { Database } from "../../../types/database.types";

export type Role = Database["public"]["Tables"]["roles"]["Row"];

export async function getRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Role[];
}
