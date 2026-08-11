import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login() {
  const { session, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already logged in and admin
  useEffect(() => {
    if (session && isAdmin && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, isAdmin, isLoading, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      // The AuthProvider will automatically pick up the session and verify admin status.
      // We will rely on the AuthProvider to update `isAdmin`. If it turns out they are not admin,
      // the ProtectedRoute will redirect them back here, or they stay here and we show an error.
      
      // Let's manually check if they are admin to show an immediate error if not
      if (authData.user) {
        const { data: isAdminResult } = await supabase.rpc("is_admin", { user_uid: authData.user.id });
        if (!isAdminResult) {
          await supabase.auth.signOut();
          setAuthError("Access denied. You do not have admin privileges.");
          return;
        }
      }
      
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      setAuthError(error.message || "An unexpected error occurred during login.");
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  // If session is there but not admin (caught by AuthProvider), we can show they need to logout or something
  if (session && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You are logged in but do not have admin privileges.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => supabase.auth.signOut()}>
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the SKShop admin panel.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {authError && (
              <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive border border-destructive/20">
                {authError}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@skshop.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Password
              </label>
              <Input
                id="password"
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
