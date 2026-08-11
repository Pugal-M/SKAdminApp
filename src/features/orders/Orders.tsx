import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders } from "./api/getOrders";
import { updateOrderStatus } from "./api/updateOrderStatus";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { useState } from "react";
import type { Order } from "./api/getOrders";

export function Orders() {
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<{orderId: string, status: string} | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) => 
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id.substring(0, 8)}...</span>
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
    },
    {
      accessorKey: "profiles.full_name",
      header: "Customer",
      cell: ({ row }) => {
        const p = row.original.profiles as { full_name: string } | null;
        return p?.full_name || "Unknown";
      }
    },
    {
      accessorKey: "total_amount",
      header: "Total",
      cell: ({ row }) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(row.original.total_amount)
    },
    {
      accessorKey: "payment_status",
      header: "Payment",
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${row.original.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {row.original.payment_status}
        </span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <select 
          value={row.original.status}
          onChange={(e) => {
            setPendingStatusChange({ orderId: row.original.id, status: e.target.value });
          }}
          className="text-sm border rounded p-1"
          disabled={updateStatusMutation.isPending}
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={async () => {
              const { printInvoice } = await import('../pos/utils/printInvoice');
              const { supabase } = await import('../../lib/supabase');
              
              // Fetch order items for this order
              const { data: itemsData } = await supabase
                .from('order_items')
                .select('*, products(name)')
                .eq('order_id', row.original.id);
                
              if (itemsData) {
                const cart = itemsData.map(item => ({
                  id: item.product_id,
                  cartItemId: item.id,
                  name: (item.products as any)?.name || 'Unknown Item',
                  quantity: item.quantity,
                  selling_price: item.price,
                  stock_quantity: 0,
                  subtotal: item.quantity * item.price
                }));
                
                printInvoice({
                  invoiceNumber: row.original.invoice_number || row.original.id,
                  cart: cart as any,
                  subtotal: row.original.total_amount,
                  tax: 0,
                  discount: 0,
                  total: row.original.total_amount,
                  paymentMethod: row.original.payment_method
                });
              }
            }}
          >
            Reprint
          </Button>
        );
      }
    }
  ];

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
  });

  const table = useReactTable({
    data: orders || [],
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground mt-1">Manage customer orders and fulfillments.</p>
        </div>
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="Search orders..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(String(event.target.value))}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      <AlertDialog open={pendingStatusChange !== null} onOpenChange={(open) => !open && setPendingStatusChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Order Status?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this order's status to {pendingStatusChange?.status}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (pendingStatusChange) {
                  updateStatusMutation.mutate(pendingStatusChange);
                  setPendingStatusChange(null);
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
