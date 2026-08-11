import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../providers/AuthProvider";

export function ProtectedRoute() {
  const { session, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p>Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
