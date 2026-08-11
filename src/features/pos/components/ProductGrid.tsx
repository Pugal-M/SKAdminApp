import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { usePOSStore } from '../store/usePOSStore';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface ProductGridProps {
  searchQuery?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ searchQuery = '' }) => {
  const addToCart = usePOSStore((state) => state.addToCart);

  // Fetch products from Supabase
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['pos-products', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, product_images(image_url)')
        .eq('is_active', true);

      if (searchQuery.trim() !== '') {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Limit for performance
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        Error loading products. Please check your connection.
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-gray-500 p-8 text-center flex flex-col items-center">
        <p>No products found {searchQuery ? `matching "${searchQuery}"` : ''}.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => {
        const outOfStock = product.stock <= 0;
        
        return (
          <Card 
            key={product.id}
            className={`cursor-pointer transition-all hover:shadow-md ${outOfStock ? 'opacity-50 grayscale' : 'hover:border-primary'}`}
            onClick={() => {
              if (!outOfStock) {
                // Map the DB product to the POS Store product format
                addToCart({
                  id: product.id,
                  name: product.name,
                  sku: '', // Not in DB yet
                  barcode: '', // Not in DB yet
                  selling_price: product.price,
                  stock_quantity: product.stock,
                  image_url: product.product_images?.[0]?.image_url || null,
                  category_id: product.category_id
                });
              }
            }}
          >
            <div className="h-32 bg-gray-100 dark:bg-zinc-800 rounded-t-xl flex items-center justify-center overflow-hidden relative">
              {product.product_images?.[0]?.image_url ? (
                <img 
                  src={product.product_images[0].image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`text-gray-400 text-xs text-center px-2 ${product.product_images?.[0]?.image_url ? 'hidden absolute' : ''}`}>
                {product.name.substring(0, 20)}
              </span>
            </div>
            <CardContent className="p-3 pb-0">
              <h3 className="font-medium text-sm line-clamp-2 min-h-[40px] leading-tight">
                {product.name}
              </h3>
            </CardContent>
            <CardFooter className="p-3 flex justify-between items-center">
              <span className="font-bold text-lg">₹{product.price.toFixed(2)}</span>
              {outOfStock ? (
                <span className="text-xs text-red-500 font-medium">Out of Stock</span>
              ) : (
                <span className="text-xs text-green-600 font-medium">{product.stock} left</span>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};
