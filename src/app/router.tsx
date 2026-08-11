import { createBrowserRouter, Navigate } from "react-router";
import { MainLayout } from "../layouts/MainLayout";
import { Dashboard } from "../features/dashboard/Dashboard";
import { Products } from "../features/products/Products";
import { Categories } from "../features/categories/Categories";
import { Inventory } from "../features/inventory/Inventory";
import { Orders } from "../features/orders/Orders";
import { Customers } from "../features/customers/Customers";
import { Banners } from "../features/banners/Banners";
import { SupportTickets } from "../features/support/SupportTickets";
import { Analytics } from "../features/analytics/Analytics";
import { Settings } from "../features/settings/Settings";
import { POSLayout } from "../features/pos";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { Login } from "../features/authentication/Login";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "pos",
        element: <POSLayout />
      },
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <Dashboard /> },
          { path: "products", element: <Products /> },
          { path: "categories", element: <Categories /> },
          { path: "inventory", element: <Inventory /> },
          { path: "orders", element: <Orders /> },
          { path: "customers", element: <Customers /> },
          { path: "banners", element: <Banners /> },
          { path: "support", element: <SupportTickets /> },
          { path: "analytics", element: <Analytics /> },
          { path: "settings", element: <Settings /> },
        ],
      }
    ],
  },
]);
