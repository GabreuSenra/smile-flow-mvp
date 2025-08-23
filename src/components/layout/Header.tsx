import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { 
  LogOut,
  Stethoscope,
  Menu,
  Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Navigation } from './Navigation';
import { supabase } from '@/integrations/supabase/client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const Header = () => {
  const { signOut, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setNotifications(data);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="border-b bg-card shadow-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">OdontoFlow</h1>
              <p className="text-sm text-muted-foreground">Sistema Odontológico</p>
            </div>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <Navigation />
        </div>

        <div className="flex items-center space-x-4">
          {/* 🔔 Sininho de notificações */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative">
                <Bell className="h-6 w-6 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <h3 className="font-semibold mb-2">Notificações</h3>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              ) : (
                <ul className="space-y-2">
                  {notifications.map((n) => (
                    <li key={n.id} className={`p-2 rounded ${n.read ? "bg-muted/50" : "bg-muted"}`}>
                      <p className="text-sm">{n.message}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString("pt-BR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PopoverContent>
          </Popover>

          <div className="text-right">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Dentista</p>
          </div>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <Navigation />
            </SheetContent>
          </Sheet>

          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};
