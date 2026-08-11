import { supabase } from "../../../lib/supabase";
import { Database } from "../../../types/database.types";

export type Customer = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCustomers(): Promise<any[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      user_roles!user_roles_user_id_fkey (
        roles (
          id,
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
