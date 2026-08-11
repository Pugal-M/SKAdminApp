import React, { useState } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, UserPlus, CreditCard, Banknote, Landmark } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';

export const CartSidebar: React.FC = () => {
  const { 
    cart, 
    cartSubtotal, 
    taxRate, 
    discountType,
    discountValue,
    totalAmount, 
    updateQuantity,
    clearCart,
    setTaxRate,
    setDiscount
  } = usePOSStore();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Split'>('Cash');

  const openCheckout = (method: 'Cash' | 'Card' | 'UPI' | 'Split') => {
    setCheckoutMethod(method);
    setIsCheckoutOpen(true);
  };

  return (
    <>
      <div className="p-4 border-b dark:border-zinc-800 shrink-0">
        <h2 className="font-semibold text-lg flex items-center justify-between">
          <span>Current Bill</span>
          <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
            {cart.length} items
          </span>
        </h2>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1 text-xs h-9">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
          <Button variant="ghost" className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={clearCart}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Trash2 className="w-12 h-12 mb-4 opacity-20" />
            <p>Cart is empty</p>
            <p className="text-xs mt-1">Scan or add products</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.cartItemId} className="flex gap-3 border-b dark:border-zinc-800 pb-3 last:border-0">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-md shrink-0 overflow-hidden relative flex items-center justify-center">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-gray-400 text-[10px] text-center px-1">{item.name.substring(0, 10)}</span>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                  <p className="font-semibold text-sm ml-2">₹{item.subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">₹{item.selling_price.toFixed(2)} / each</p>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 rounded-md p-1">
                    <button 
                      className="w-6 h-6 flex items-center justify-center bg-white dark:bg-zinc-700 shadow-sm rounded-sm hover:bg-gray-100"
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                    <button 
                      className="w-6 h-6 flex items-center justify-center bg-white dark:bg-zinc-700 shadow-sm rounded-sm hover:bg-gray-100"
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock_quantity}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-zinc-900 border-t dark:border-zinc-800 shrink-0">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">₹{cartSubtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Discount</span>
            <div className="flex gap-2 items-center w-1/2">
              <select 
                className="text-xs border rounded p-1 dark:bg-zinc-800 dark:border-zinc-700 w-20"
                value={discountType}
                onChange={(e) => setDiscount(e.target.value as 'percentage' | 'fixed', discountValue)}
              >
                <option value="fixed">₹ Fixed</option>
                <option value="percentage">% Perc</option>
              </select>
              <Input 
                type="number" 
                className="h-7 text-xs text-right" 
                value={discountValue} 
                onChange={(e) => setDiscount(discountType, Number(e.target.value))} 
                min={0}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Tax / GST</span>
            <select 
              className="text-xs border rounded p-1 dark:bg-zinc-800 dark:border-zinc-700"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>
          
          <div className="pt-2 mt-2 border-t dark:border-zinc-800 flex justify-between items-center">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-2xl text-primary">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <Button 
            className="flex flex-col gap-1 h-auto py-3 bg-emerald-600 hover:bg-emerald-700 text-white" 
            disabled={cart.length === 0}
            onClick={() => openCheckout('Cash')}
          >
            <Banknote className="w-5 h-5" />
            <span className="text-xs">Cash</span>
          </Button>
          <Button 
            className="flex flex-col gap-1 h-auto py-3 bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={cart.length === 0}
            onClick={() => openCheckout('Card')}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs">Card/UPI</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex flex-col gap-1 h-auto py-3 border-dashed" 
            disabled={cart.length === 0}
            onClick={() => openCheckout('Split')}
          >
            <Landmark className="w-5 h-5" />
            <span className="text-xs">Split</span>
          </Button>
        </div>
      </div>
      
      {isCheckoutOpen && (
        <CheckoutModal 
          isOpen={isCheckoutOpen} 
          onClose={() => setIsCheckoutOpen(false)} 
          defaultPaymentMethod={checkoutMethod} 
        />
      )}
    </>
  );
};
