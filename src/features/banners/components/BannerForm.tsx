import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../../components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

const bannerSchema = z.object({
  title: z.string().optional(),
  link_type: z.string().optional(),
  link_value: z.string().optional(),
  is_active: z.boolean().default(true),
  image: z.any().optional(),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

export function BannerForm({ onClose, initialData }: { onClose: () => void, initialData?: any }) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema) as any,
    defaultValues: initialData || {
      title: "",
      link_type: "",
      link_value: "",
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

  const onSubmit = async (data: BannerFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      let bannerId = initialData?.id;
      let imageUrl = initialData?.image_url;
      const { image, ...bannerData } = data;

      // Handle Image Upload if provided
      if (image && image.length > 0) {
        const file = image[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `banners/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);
          
        imageUrl = publicUrlData.publicUrl;
      }

      if (!imageUrl && !initialData) {
        throw new Error("Image is required for a new banner");
      }

      const payload = {
        ...bannerData,
        image_url: imageUrl,
      };

      if (bannerId) {
        // Update
        const { error: updateError } = await supabase
          .from("banners")
          .update(payload)
          .eq("id", bannerId);
        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from("banners")
          .insert([payload]);
        if (insertError) throw insertError;
      }

      queryClient.invalidateQueries({ queryKey: ["banners"] });
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Banner" : "Add Banner"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && <div className="text-destructive text-sm">{error}</div>}

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input {...register("title")} placeholder="Banner Title" />
            {errors.title && <span className="text-xs text-destructive">{errors.title.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Link Type</label>
            <select
              {...register("link_type")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">None</option>
              <option value="product">Product</option>
              <option value="category">Category</option>
              <option value="external">External Link</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Link Value</label>
            <Input {...register("link_value")} placeholder="Product ID, Category ID, or URL" />
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="is_active" {...register("is_active")} />
            <label htmlFor="is_active" className="text-sm font-medium">Is Active</label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Banner Image {initialData ? "(Leave empty to keep current)" : "*"}</label>
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
              <img src={initialData.image_url} alt="Current banner" className="h-20 rounded object-cover" />
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Banner"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
