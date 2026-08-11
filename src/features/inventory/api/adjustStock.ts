import { supabase } from "../../../lib/supabase";

export async function adjustStock(productId: string, currentStock: number, changeAmount: number, reason: string, adminId: string): Promise<void> {
  const newStock = currentStock + changeAmount;
  if (newStock < 0) {
    throw new Error("Stock cannot be negative.");
  }

  // Use a transaction/RPC ideally, but for now we'll do sequential since there is no custom RPC available in the schema.
  // 1. Update stock
  const { error: updateError } = await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", productId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // 2. Insert stock_history
  const { error: historyError } = await supabase
    .from("stock_history")
    .insert([{
      product_id: productId,
      change_amount: changeAmount,
      reason: reason,
      adjusted_by: adminId,
    }]);

  if (historyError) {
    throw new Error(historyError.message);
  }
}
