import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Camera, Plus } from "lucide-react";
import { CameraScanner } from "../pos/components/CameraScanner";
import { getCategories } from "../categories/api/getCategories";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import { CategoryForm } from "../categories/CategoryForm";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  stock: z.coerce.number().min(0, "Stock cannot be negative"),
  category_id: z.string().min(1, "Category is required"),
  barcode: z.string().optional(),
  image: z.any().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductForm({ onClose, initialData }: { onClose: () => void, initialData?: any }) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData || {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category_id: "",
      barcode: "",
    }
  });

  const selectedImage = watch("image");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedImage && selectedImage.length > 0) {
      const url = URL.createObjectURL(selectedImage[0]);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedImage]);

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      let productId = initialData?.id;
      const { image, ...productData } = data;

      if (productId) {
        // Update
        const { error: updateError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productId);
        if (updateError) throw updateError;
      } else {
        // Insert
        const { data: newProduct, error: insertError } = await supabase
          .from("products")
          .insert([productData])
          .select("id")
          .single();
        if (insertError) throw insertError;
        productId = newProduct.id;
      }

      // Handle Image Upload if provided
      if (image && image.length > 0 && productId) {
        const file = image[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}-${Math.random()}.${fileExt}`;
        const filePath = `product_images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images") // Assuming a bucket named "images" exists
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);

        const { error: imageInsertError } = await supabase
          .from("product_images")
          .insert([{
            product_id: productId,
            image_url: publicUrlData.publicUrl
          }]);

        if (imageInsertError) throw imageInsertError;
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>{initialData ? "Edit Product" : "Add Product"}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && <div className="text-destructive text-sm">{error}</div>}

            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input {...register("name")} placeholder="Product Name" />
              {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input {...register("description")} placeholder="Product Description" />
              {errors.description && <span className="text-xs text-destructive">{errors.description.message}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price</label>
                <Input type="number" step="0.01" {...register("price")} placeholder="0.00" />
                {errors.price && <span className="text-xs text-destructive">{errors.price.message}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Stock</label>
                <Input type="number" {...register("stock")} placeholder="0" />
                {errors.stock && <span className="text-xs text-destructive">{errors.stock.message}</span>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between items-center">
                Category
                <button
                  type="button"
                  className="text-xs flex items-center text-primary hover:underline"
                  onClick={() => setIsCategoryModalOpen(true)}
                >
                  <Plus className="w-3 h-3 mr-1" /> New
                </button>
              </label>
              <select
                {...register("category_id")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a Category</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category_id && <span className="text-xs text-destructive">{errors.category_id.message as string}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                Barcode / SKU
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs flex items-center text-primary hover:underline"
                    onClick={() => setIsScannerOpen(true)}
                  >
                    <Camera className="w-3 h-3 mr-1" /> Scan
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      const ean = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
                      setValue("barcode", ean, { shouldValidate: true });
                    }}
                  >
                    Generate Random
                  </button>
                </div>
              </label>
              <Input {...register("barcode")} placeholder="Scan or enter barcode" />
              {errors.barcode && <span className="text-xs text-destructive">{errors.barcode.message as string}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Product Image (Optional)</label>
              <Input type="file" accept="image/*" {...register("image")} />
              {errors.image && <span className="text-xs text-destructive">{errors.image.message as string}</span>}
            </div>
            
            {previewUrl ? (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-1">Preview:</p>
                <img src={previewUrl} alt="Preview" className="h-20 rounded object-cover" />
              </div>
            ) : initialData?.image_url ? (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-1">Current Image:</p>
                <img src={initialData.image_url} alt="Current product" className="h-20 rounded object-cover" />
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Product"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      {isScannerOpen && (
        <CameraScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(code) => {
            setValue("barcode", code, { shouldValidate: true });
            setIsScannerOpen(false);
          }}
        />
      )}

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="p-0 bg-transparent border-0 shadow-none">
          <CategoryForm onClose={() => setIsCategoryModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
