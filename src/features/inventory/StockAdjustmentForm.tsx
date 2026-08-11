import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { adjustStock } from "./api/adjustStock";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../providers/AuthProvider";

const stockSchema = z.object({
  change_amount: z.coerce.number().refine(val => val !== 0, "Change amount cannot be 0"),
  reason: z.string().min(1, "Reason is required"),
});

type StockFormValues = z.infer<typeof stockSchema>;

export function StockAdjustmentForm({ onClose, product }: { onClose: () => void, product: any }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema) as any,
    defaultValues: {
      change_amount: 0,
      reason: "",
    }
  });

  const onSubmit = async (data: StockFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!user?.id) throw new Error("User not authenticated");
      await adjustStock(product.id, product.stock, data.change_amount, data.reason, user.id);
      
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while adjusting stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Adjust Stock for {product.name}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && <div className="text-destructive text-sm">{error}</div>}
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current Stock: <strong className="text-foreground">{product.stock}</strong></p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Adjustment Amount (+/-)</label>
            <Input type="number" {...register("change_amount")} placeholder="e.g. 10 or -5" />
            {errors.change_amount && <span className="text-xs text-destructive">{errors.change_amount.message as string}</span>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Input {...register("reason")} placeholder="e.g. Restock, Damaged goods" />
            {errors.reason && <span className="text-xs text-destructive">{errors.reason.message as string}</span>}
          </div>

        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Adjustment"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
