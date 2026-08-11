import { supabase } from "../../../lib/supabase";
import { Database } from "../../../types/database.types";

export type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  profiles?: { full_name: string, email: string } | null;
  addresses?: Database["public"]["Tables"]["addresses"]["Row"] | null;
};

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles(full_name, email),
      addresses(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown) as Order[];
}
