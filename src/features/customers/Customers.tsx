import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers } from "./api/getCustomers";
import { getRoles } from "./api/getRoles";
import { updateUserRole } from "./api/updateUserRole";
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
import { Dialog, DialogContent } from "../../components/ui/dialog";
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
export function Customers() {
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string, roleId: string } | null>(null);

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => updateUserRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const handleRoleChange = (userId: string, roleId: string) => {
    setPendingRoleChange({ userId, roleId });
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "full_name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "N/A"
    },
    {
      accessorKey: "created_at",
      header: "Joined",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => {
        const userRoles = row.original.user_roles || [];
        const currentRole = userRoles.length > 0 ? userRoles[0].roles : null;

        return (
          <select
            className="border rounded px-2 py-1 text-sm bg-transparent"
            value={currentRole?.id || ""}
            onChange={(e) => handleRoleChange(row.original.id, e.target.value)}
            disabled={updateRoleMutation.isPending}
          >
            <option value="" disabled>Select Role</option>
            {roles?.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        );
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(row.original)}>
            View Details
          </Button>
        );
      },
    },
  ];

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const table = useReactTable({
    data: customers || [],
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
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground mt-1">Manage customer accounts and profiles.</p>
        </div>
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="Search customers..."
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
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Customer Details</h2>
          </div>
          {selectedCustomer && (
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center justify-center space-y-3 mb-2">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold overflow-hidden">
                  {selectedCustomer.avatar_url ? (
                    <img src={selectedCustomer.avatar_url} alt={selectedCustomer.full_name} className="w-full h-full object-cover" />
                  ) : (
                    selectedCustomer.full_name.charAt(0).toUpperCase()
                  )}
                </div>
                <h3 className="text-lg font-semibold">{selectedCustomer.full_name}</h3>
              </div>

              <div className="grid grid-cols-4 items-center gap-4 border-t pt-4">
                <span className="text-sm font-medium text-muted-foreground">ID</span>
                <span className="col-span-3 text-sm truncate">{selectedCustomer.id}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">Email</span>
                <span className="col-span-3 text-sm font-medium">{selectedCustomer.email}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">Phone</span>
                <span className="col-span-3 text-sm">{selectedCustomer.phone || "Not provided"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">Joined</span>
                <span className="col-span-3 text-sm">{new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setSelectedCustomer(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

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

      <AlertDialog open={pendingRoleChange !== null} onOpenChange={(open) => !open && setPendingRoleChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change this user's role. This is a sensitive action that alters their permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRoleChange) {
                  updateRoleMutation.mutate(pendingRoleChange);
                  setPendingRoleChange(null);
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
