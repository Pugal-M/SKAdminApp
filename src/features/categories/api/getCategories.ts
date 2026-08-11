import { supabase } from "../../../lib/supabase";
import { Database } from "../../../types/database.types";

export type Category = Database["public"]["Tables"]["categories"]["Row"] & {
  parent?: { name: string } | null;
};

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select(`
      *,
      parent:categories!parent_id(name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown) as Category[];
}
