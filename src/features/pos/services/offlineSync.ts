import localforage from 'localforage';
import { supabase } from '@/lib/supabase';
import { CartItem } from '../store/usePOSStore';

export interface OfflineOrder {
  id: string;
  cart: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  userId: string;
  timestamp: number;
}

const OFFLINE_ORDERS_KEY = 'pos_offline_orders';

export const saveOfflineOrder = async (order: OfflineOrder) => {
  try {
    const existingOrders: OfflineOrder[] = (await localforage.getItem(OFFLINE_ORDERS_KEY)) || [];
    existingOrders.push(order);
    await localforage.setItem(OFFLINE_ORDERS_KEY, existingOrders);
    console.log('Order saved offline successfully.', order.id);
  } catch (error) {
    console.error('Failed to save order offline:', error);
    throw error;
  }
};

export const getOfflineOrders = async (): Promise<OfflineOrder[]> => {
  try {
    return (await localforage.getItem(OFFLINE_ORDERS_KEY)) || [];
  } catch (error) {
    console.error('Failed to get offline orders:', error);
    return [];
  }
};

export const clearOfflineOrders = async () => {
  try {
    await localforage.removeItem(OFFLINE_ORDERS_KEY);
  } catch (error) {
    console.error('Failed to clear offline orders:', error);
  }
};

export const syncOfflineOrders = async () => {
  if (!navigator.onLine) {
    console.log('Cannot sync, still offline.');
    return;
  }

  const orders = await getOfflineOrders();
  if (orders.length === 0) {
    console.log('No offline orders to sync.');
    return;
  }

  console.log(`Starting sync for ${orders.length} offline orders...`);
  
  const failedOrders: OfflineOrder[] = [];

  for (const order of orders) {
    try {
      // Call Atomic Checkout RPC
      const { data: rawData, error: rpcError } = await (supabase.rpc as any)('process_pos_checkout', {
        p_user_id: order.userId,
        p_total_amount: order.totalAmount,
        p_payment_method: order.paymentMethod,
        p_offline_invoice_num: `INV-${new Date(order.timestamp).toISOString().slice(0,10).replace(/-/g,'')}-OFF-${order.id.substring(0, 5).toUpperCase()}`,
        p_cart_items: order.cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.selling_price,
          stock_quantity: item.stock_quantity
        }))
      });

      const rpcData = rawData as any;

      if (rpcError) {
        throw rpcError;
      }

      if (!rpcData || !rpcData.success) {
        throw new Error('Checkout failed on the server.');
      }
      
      console.log(`Successfully synced offline order: ${order.id}`);
    } catch (error) {
      console.error(`Failed to sync order ${order.id}:`, error);
      // Keep it in the failed array to retry later
      failedOrders.push(order);
    }
  }

  // Update local storage with any orders that failed to sync
  if (failedOrders.length > 0) {
    await localforage.setItem(OFFLINE_ORDERS_KEY, failedOrders);
    console.log(`${failedOrders.length} orders failed to sync and remain in offline storage.`);
  } else {
    await clearOfflineOrders();
    console.log('All offline orders synced successfully.');
  }
};
