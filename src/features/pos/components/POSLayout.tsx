import React, { useState, useEffect, useRef } from 'react';
import { ProductGrid } from './ProductGrid';
import { CartSidebar } from './CartSidebar';
import { Input } from '@/components/ui/input';
import { Search, Barcode, Camera, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraScanner } from './CameraScanner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { usePOSStore } from '../store/usePOSStore';
import type { Product } from '../../products/api/getProducts';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ProductForm } from '../../products/ProductForm';

import { Link } from 'react-router';

export const POSLayout: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [unfoundBarcode, setUnfoundBarcode] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { addToCart, cart, updateQuantity } = usePOSStore();

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Offline Sync Listener
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Network is back online. Attempting to sync offline orders...');
      const { syncOfflineOrders } = await import('../services/offlineSync');
      await syncOfflineOrders();
    };

    window.addEventListener('online', handleOnline);
    if (navigator.onLine) {
      handleOnline();
    }
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const processBarcode = async (barcode: string) => {
    if (!barcode) return;

    // 1. Check local cache first (< 1s lookup)
    const cachedProducts = queryClient.getQueryData<Product[]>(['products']) || [];
    let product = cachedProducts.find(p => p.barcode === barcode);

    // 2. If not found in cache, query Supabase
    if (!product) {
      // 2. Not in cache? Fetch from Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name), product_images(image_url)')
        .eq('barcode', barcode)
        .single();

      if (!error && data) {
        product = data as unknown as Product;
      }
    }

    if (product) {
      // 3. Add to cart or increase quantity
      const existingCartItem = cart.find((item: any) => item.id === product?.id);
      if (existingCartItem) {
        if (existingCartItem.quantity < product.stock) {
          updateQuantity(existingCartItem.cartItemId, existingCartItem.quantity + 1);
        } else {
          alert(`Insufficient stock for ${product.name}`);
        }
      } else {
        if (product.stock > 0) {
          addToCart({
            id: product.id,
            name: product.name,
            sku: product.barcode || product.id,
            selling_price: product.price,
            stock_quantity: product.stock,
            image_url: product.product_images?.[0]?.image_url || product.image_url || null,
            category_id: product.category_id,
            barcode: product.barcode
          });
        } else {
          alert(`${product.name} is out of stock!`);
        }
      }
    } else {
      // 4. Product not found
      if (window.confirm(`Barcode ${barcode} not found! Would you like to add it to the inventory?`)) {
        setUnfoundBarcode(barcode);
        setIsProductFormOpen(true);
      }
    }
  };

  const handleManualBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcode(barcodeInput);
    setBarcodeInput('');
  };

  // Barcode Scanner Listener & Keyboard Shortcuts
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Keyboard Shortcuts
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        usePOSStore.getState().clearCart();
        return;
      }

      // Ignore barcode buffer if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentTime = Date.now();

      // If time between keystrokes is more than 30ms, it's likely a human typing, not a scanner
      if (currentTime - lastKeyTime > 30) {
        barcodeBuffer = '';
      }

      if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        processBarcode(barcodeBuffer);
        barcodeBuffer = '';
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }

      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, queryClient, addToCart, updateQuantity]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden dark:bg-zinc-950">
      {/* Left Panel: Products */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r dark:border-zinc-800">
        <header className="p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex items-center gap-4 shrink-0 shadow-sm">
          <Link to="/dashboard">
            <Button variant="ghost" className="px-2" title="Back to Dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="Search products by name (F2)"
              className="pl-10 h-12 w-full text-lg shadow-sm border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <form onSubmit={handleManualBarcodeSubmit} className="relative flex gap-2">
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Manual Barcode Entry"
                className="pl-10 h-12 w-48 border-gray-200"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-12 p-0"
              onClick={() => setIsScannerOpen(true)}
              title="Camera Scanner"
            >
              <Camera className="h-5 w-5 text-gray-600" />
            </Button>
          </form>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <ProductGrid searchQuery={debouncedSearch} />
        </div>
      </div>

      {/* Right Panel: Cart */}
      <div className="w-[400px] shrink-0 bg-white dark:bg-zinc-900 flex flex-col h-full shadow-lg z-10">
        <CartSidebar />
      </div>

      {isScannerOpen && (
        <CameraScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(code) => {
            processBarcode(code);
          }}
        />
      )}

      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 bg-transparent border-0 shadow-none">
          <ProductForm 
            onClose={() => setIsProductFormOpen(false)} 
            initialData={{ 
              name: "",
              description: "",
              price: 0,
              stock: 0,
              category_id: "",
              barcode: unfoundBarcode 
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
