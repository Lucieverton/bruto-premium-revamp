import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn, user, userRole, loading: authLoading, isAdminLoading } = useAuth();

  // Redirect if already logged in as admin or barber
  useEffect(() => {
    if (!authLoading && !isAdminLoading && user && (userRole === 'admin' || userRole === 'barber')) {
      navigate('/admin');
    }
  }, [user, userRole, authLoading, isAdminLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        setError('Email ou senha incorretos');
        setLoading(false);
        return;
      }

      // Verify if user has admin or barber role before navigating
      if (data?.user) {
        // Check admin role first
        const { data: adminRoleData, error: adminError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (adminError) {
          console.error('Error checking admin role:', adminError);
        }

        if (adminRoleData) {
          setLoading(false);
          navigate('/admin');
          return;
        }

        // Check barber role
        const { data: barberRoleData, error: barberError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'barber')
          .maybeSingle();

        if (barberError) {
          console.error('Error checking barber role:', barberError);
        }

        if (barberRoleData) {
          setLoading(false);
          navigate('/admin');
          return;
        }

        // No valid role found
        setError('Acesso negado. Você não tem permissão de funcionário.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      } else {
        setError('Erro ao autenticar. Tente novamente.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src={logo} 
            alt="Brutos Barbearia" 
            className="h-20 w-auto mx-auto mb-4"
          />
          <h1 className="font-display text-3xl uppercase">Admin</h1>
          <p className="text-muted-foreground mt-2">Acesso restrito a funcionários</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
          {error && (
            <div className="bg-destructive/20 border border-destructive text-destructive p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase"
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <LogIn className="mr-2" size={20} />
            )}
            Entrar
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          <a href="/" className="hover:text-foreground transition-colors">
            ← Voltar ao site
          </a>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
