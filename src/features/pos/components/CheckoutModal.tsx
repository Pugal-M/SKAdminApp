import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePOSStore } from '../store/usePOSStore';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPaymentMethod: 'Cash' | 'Card' | 'UPI' | 'Split';
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, defaultPaymentMethod }) => {
  const { cart, totalAmount, clearCart, selectedCustomerId, cartSubtotal, discountType, discountValue } = usePOSStore();
  const { user } = useAuth(); // Assume we have a useAuth hook to get the logged-in admin
  
  const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod);
  const [cashReceived, setCashReceived] = useState<number>(totalAmount);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeToReturn = Math.max(0, cashReceived - totalAmount);

  const handleCheckout = async () => {
    if (!user) {
      setError("You must be logged in to process a sale.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const userId = selectedCustomerId || user.id;

    try {
      if (!navigator.onLine) {
        throw new Error('OFFLINE');
      }

      // Call Atomic Checkout RPC
      const { data: rawData, error: rpcError } = await (supabase.rpc as any)('process_pos_checkout', {
        p_user_id: userId,
        p_total_amount: totalAmount,
        p_payment_method: paymentMethod,
        p_cart_items: cart.map(item => ({
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

      const invoiceNumber = rpcData.invoice_number;
      // const orderId = rpcData.order_id;

      alert("Payment successful! Invoice: " + invoiceNumber);
      
      // Print Invoice
      import('../utils/printInvoice').then(({ printInvoice }) => {
        printInvoice({
          invoiceNumber: invoiceNumber,
          cart: [...cart],
          subtotal: cartSubtotal,
          tax: totalAmount - (cartSubtotal - (discountType === 'fixed' ? discountValue : cartSubtotal * (discountValue / 100))),
          discount: discountType === 'fixed' ? discountValue : cartSubtotal * (discountValue / 100),
          total: totalAmount,
          paymentMethod
        });
      });
      
      clearCart();
      onClose();
      
    } catch (err: any) {
      // Offline Fallback
      if (err.message === 'OFFLINE' || err.message === 'Failed to fetch') {
        console.log('Network error detected. Saving order offline.');
        
        try {
          const offlineOrderId = crypto.randomUUID();
          const { saveOfflineOrder } = await import('../services/offlineSync');
          await saveOfflineOrder({
            id: offlineOrderId,
            cart: [...cart],
            totalAmount,
            paymentMethod,
            userId,
            timestamp: Date.now()
          });
          
          alert("You are offline. Order saved locally and will sync when connection is restored.");
          
          // Print Offline Invoice
          import('../utils/printInvoice').then(({ printInvoice }) => {
            printInvoice({
              invoiceNumber: `OFF-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${offlineOrderId.substring(0, 5).toUpperCase()}`,
              cart: [...cart],
              subtotal: cartSubtotal,
              tax: totalAmount - (cartSubtotal - (discountType === 'fixed' ? discountValue : cartSubtotal * (discountValue / 100))),
              discount: discountType === 'fixed' ? discountValue : cartSubtotal * (discountValue / 100),
              total: totalAmount,
              paymentMethod
            });
          });
          
          clearCart();
          onClose();
        } catch (offlineErr) {
          console.error('Failed to save offline:', offlineErr);
          setError('Network is offline, and failed to save locally.');
        }
      } else {
        console.error('Checkout error:', err);
        setError(err.message || 'An error occurred during checkout.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Complete Checkout</h2>
          <p className="text-sm text-muted-foreground">
            Process payment for the current bill.
          </p>
        </div>

        <div className="grid gap-4 py-4">
          <div className="flex justify-between items-center text-lg font-bold p-3 bg-gray-50 dark:bg-zinc-900 rounded-md">
            <span>Total Due:</span>
            <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['Cash', 'Card', 'UPI'] as const).map((method) => (
              <Button
                key={method}
                type="button"
                variant={paymentMethod === method ? 'default' : 'outline'}
                onClick={() => setPaymentMethod(method)}
                className="w-full"
              >
                {method}
              </Button>
            ))}
          </div>

          {paymentMethod === 'Cash' && (
            <div className="space-y-3 mt-2 border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Cash Received:</span>
                <Input 
                  type="number" 
                  value={cashReceived} 
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  className="w-32 text-right text-lg font-semibold"
                  autoFocus
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm text-gray-500">Change to Return:</span>
                <span className={`text-lg font-bold ${changeToReturn > 0 ? 'text-green-600' : ''}`}>
                  ₹{changeToReturn.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleCheckout} 
            disabled={isProcessing || (paymentMethod === 'Cash' && cashReceived < totalAmount)}
            className="w-32"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
