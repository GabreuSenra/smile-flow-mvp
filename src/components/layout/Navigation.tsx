import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  CalendarPlus,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Pacientes', href: '/patients', icon: Users },
  { name: 'Consultas', href: '/appointments', icon: CalendarPlus },
  { name: 'Calendário', href: '/calendar', icon: Calendar },
  { name: 'Relatórios', href: '/reports', icon: FileText },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="flex md:flex-row flex-col md:space-x-6 space-y-2 md:space-y-0">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};