import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  selling_price: number;
  stock_quantity: number;
  image_url: string | null;
  category_id: string | null;
}

export interface CartItem extends Product {
  cartItemId: string; // Unique ID for the cart item instance
  quantity: number;
  subtotal: number;
}

export interface POSState {
  cart: CartItem[];
  cartSubtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  taxRate: number; // e.g. 0, 5, 12, 18, 28
  totalAmount: number;
  selectedCustomerId: string | null;
  
  // Actions
  addToCart: (product: Product) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  setDiscount: (type: 'percentage' | 'fixed', value: number) => void;
  setTaxRate: (rate: number) => void;
  setCustomer: (customerId: string | null) => void;
  clearCart: () => void;
}

const calculateTotals = (cart: CartItem[], discountType: 'percentage' | 'fixed', discountValue: number, taxRate: number) => {
  const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
  
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = subtotal * (discountValue / 100);
  } else {
    discountAmount = discountValue;
  }
  
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;
  
  return {
    cartSubtotal: subtotal,
    totalAmount: total
  };
};

export const usePOSStore = create<POSState>((set) => ({
  cart: [],
  cartSubtotal: 0,
  discountType: 'fixed',
  discountValue: 0,
  taxRate: 0,
  totalAmount: 0,
  selectedCustomerId: null,

  addToCart: (product) => set((state) => {
    const existingItemIndex = state.cart.findIndex(item => item.id === product.id);
    
    let newCart = [...state.cart];
    if (existingItemIndex >= 0) {
      const existingItem = newCart[existingItemIndex];
      if (existingItem.quantity < existingItem.stock_quantity) {
        existingItem.quantity += 1;
        existingItem.subtotal = existingItem.quantity * existingItem.selling_price;
      }
    } else {
      newCart.push({
        ...product,
        cartItemId: crypto.randomUUID(),
        quantity: 1,
        subtotal: product.selling_price,
      });
    }

    const totals = calculateTotals(newCart, state.discountType, state.discountValue, state.taxRate);
    
    return {
      cart: newCart,
      ...totals
    };
  }),

  removeFromCart: (cartItemId) => set((state) => {
    const newCart = state.cart.filter(item => item.cartItemId !== cartItemId);
    const totals = calculateTotals(newCart, state.discountType, state.discountValue, state.taxRate);
    
    return {
      cart: newCart,
      ...totals
    };
  }),

  updateQuantity: (cartItemId, quantity) => set((state) => {
    const newCart = state.cart.map(item => {
      if (item.cartItemId === cartItemId) {
        // Enforce stock limits
        const newQty = Math.max(1, Math.min(quantity, item.stock_quantity));
        return {
          ...item,
          quantity: newQty,
          subtotal: newQty * item.selling_price
        };
      }
      return item;
    });
    
    const totals = calculateTotals(newCart, state.discountType, state.discountValue, state.taxRate);
    
    return {
      cart: newCart,
      ...totals
    };
  }),

  setDiscount: (type, value) => set((state) => {
    const totals = calculateTotals(state.cart, type, value, state.taxRate);
    return {
      discountType: type,
      discountValue: value,
      ...totals
    };
  }),

  setTaxRate: (rate) => set((state) => {
    const totals = calculateTotals(state.cart, state.discountType, state.discountValue, rate);
    return {
      taxRate: rate,
      ...totals
    };
  }),

  setCustomer: (customerId) => set({ selectedCustomerId: customerId }),

  clearCart: () => set({
    cart: [],
    cartSubtotal: 0,
    totalAmount: 0,
    selectedCustomerId: null,
    discountValue: 0
  })
}));
