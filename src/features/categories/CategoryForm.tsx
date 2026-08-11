import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  parent_id: z.string().optional(),
  is_active: z.boolean().default(true),
  image: z.any().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoryForm({ onClose, initialData }: { onClose: () => void, initialData?: any }) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: initialData || {
      name: "",
      parent_id: "",
      is_active: true,
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

  const onSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      let categoryId = initialData?.id;
      const { image, parent_id, ...categoryData } = data;
      
      const payload: any = { ...categoryData };
      if (parent_id) {
        payload.parent_id = parent_id;
      }

      if (categoryId) {
        // Update
        const { error: updateError } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", categoryId);
        if (updateError) throw updateError;
      } else {
        // Insert
        // Need to provide dummy image_url for now if it is required. DB schema says image_url: string (not null)
        payload.image_url = "https://via.placeholder.com/150";

        const { data: newCategory, error: insertError } = await supabase
          .from("categories")
          .insert([payload])
          .select("id")
          .single();
        if (insertError) throw insertError;
        categoryId = newCategory.id;
      }

      // Handle Image Upload if provided
      if (image && image.length > 0 && categoryId) {
        const file = image[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${categoryId}-${Math.random()}.${fileExt}`;
        const filePath = `category_images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);

        const { error: imageUpdateError } = await supabase
          .from("categories")
          .update({ image_url: publicUrlData.publicUrl })
          .eq("id", categoryId);

        if (imageUpdateError) throw imageUpdateError;
      }

      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Category" : "Add Category"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && <div className="text-destructive text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input {...register("name")} placeholder="Category Name" />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message as string}</span>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Parent Category ID (Optional)</label>
            <Input {...register("parent_id")} placeholder="Parent UUID" />
            {errors.parent_id && <span className="text-xs text-destructive">{errors.parent_id.message as string}</span>}
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="is_active" {...register("is_active")} />
            <label htmlFor="is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Active
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category Image</label>
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
              <img src={initialData.image_url} alt="Current category" className="h-20 rounded object-cover" />
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Category"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
