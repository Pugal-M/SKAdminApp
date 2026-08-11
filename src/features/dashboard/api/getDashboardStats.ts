import { supabase } from "../../../lib/supabase";

export type DashboardStats = {
  totalOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  recentOrders: any[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  // Get total orders today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  // Get total revenue (sum of all completed orders)
  const { data: revenueData } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("status", "completed");

  const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

  // Get low stock items count (< 10 items)
  const { count: lowStockItems } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .lt("stock", 10);

  // Get 5 recent orders
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, created_at, total_amount, status, profiles(email, full_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    totalOrders: totalOrders || 0,
    totalRevenue,
    lowStockItems: lowStockItems || 0,
    recentOrders: recentOrders || [],
  };
}
