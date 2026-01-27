import { ReactNode, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Scissors, 
  LayoutDashboard, 
  DollarSign, 
  Settings, 
  LogOut,
  Menu,
  X,
  User,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleQueueActive } from '@/hooks/useAdminQueue';
import { useQueueSettings } from '@/hooks/useQueue';
import { Switch } from '@/components/ui/switch';
import logo from '@/assets/logo.png';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

// Full nav items for admins
const adminNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Fila' },
  { href: '/admin/barbeiros', icon: Users, label: 'Barbeiros' },
  { href: '/admin/servicos', icon: Scissors, label: 'Serviços' },
  { href: '/admin/financeiro', icon: DollarSign, label: 'Financeiro' },
  { href: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
];

// Limited nav items for barbers
const barberNavItems = [
  { href: '/admin/atendimento', icon: Play, label: 'Atendimento' },
  { href: '/admin', icon: LayoutDashboard, label: 'Fila' },
  { href: '/admin/meu-financeiro', icon: DollarSign, label: 'Financeiro' },
  { href: '/admin/meu-perfil', icon: User, label: 'Meu Perfil' },
  { href: '/admin/conta', icon: Settings, label: 'Configurações' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, userRole, isAdmin, isBarber, loading, isAdminLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: settings } = useQueueSettings();
  const toggleQueue = useToggleQueueActive();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Only redirect if we're done loading AND we know the user has no valid role
    if (!loading && !isAdminLoading && user && !isAdmin && !isBarber) {
      navigate('/');
    }
  }, [user, isAdmin, isBarber, loading, isAdminLoading, navigate]);

  // Show loading while checking auth or role status
  if (loading || isAdminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || (!isAdmin && !isBarber)) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const isQueueActive = settings?.is_active ?? true;

  // Select appropriate nav items based on role
  const navItems = isAdmin ? adminNavItems : barberNavItems;

  // Get role display name
  const roleLabel = isAdmin ? 'Administrador' : 'Barbeiro';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
          <img src={logo} alt="Brutos" className="h-8 w-auto" />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">Fila:</span>
            <Switch
              checked={isQueueActive}
              onCheckedChange={(checked) => toggleQueue.mutate(checked)}
            />
          </div>
        )}
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Brutos" className="h-10 w-auto" />
            <div>
              <div className="font-display text-lg uppercase">Brutos</div>
              <div className="text-xs text-muted-foreground">{roleLabel}</div>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          {isAdmin && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Fila</span>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isQueueActive ? 'bg-green-500' : 'bg-red-500'
                )} />
                <Switch
                  checked={isQueueActive}
                  onCheckedChange={(checked) => toggleQueue.mutate(checked)}
                />
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground mb-2">
            {user.email}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut size={16} className="mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
};
