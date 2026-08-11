import { supabase } from "../../../lib/supabase";
import { Database } from "../../../types/database.types";

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  categories?: { name: string } | null;
  product_images?: { image_url: string }[] | null;
  image_url?: string | null; // For backward compatibility if used directly
};

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown) as Product[];
}
