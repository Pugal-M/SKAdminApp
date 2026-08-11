import { supabase } from "../../../lib/supabase";
import { Database } from "../../../types/database.types";

export type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"] & {
  profiles?: { full_name: string, email: string } | null;
};

export async function getTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select(`
      *,
      profiles(full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown) as Ticket[];
}
