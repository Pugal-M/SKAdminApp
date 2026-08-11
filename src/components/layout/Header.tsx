import { useTheme } from "../../providers/ThemeProvider";
import { Moon, Sun, User, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../providers/AuthProvider";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        {/* Breadcrumbs can go here */}
      </div>
      
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2 border-l pl-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign Out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
