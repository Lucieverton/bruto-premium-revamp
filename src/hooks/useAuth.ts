import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'barber' | 'user' | null;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBarber, setIsBarber] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const { toast } = useToast();

  // Update barber status on login/logout
  const updateBarberStatus = useCallback(async (userId: string, status: 'online' | 'offline') => {
    try {
      await supabase.rpc('update_barber_status_on_auth', {
        p_user_id: userId,
        p_status: status
      });
    } catch (error) {
      console.error('Error updating barber status:', error);
    }
  }, []);

  const checkUserRole = useCallback(async (userId: string) => {
    setIsAdminLoading(true);
    try {
      // Check for admin role first
      const { data: adminData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (adminData) {
        setUserRole('admin');
        setIsAdmin(true);
        setIsBarber(false);
        setIsAdminLoading(false);
        // Update barber status if also a barber
        updateBarberStatus(userId, 'online');
        return;
      }

      // Check for barber role
      const { data: barberData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'barber')
        .maybeSingle();
      
      if (barberData) {
        setUserRole('barber');
        setIsAdmin(false);
        setIsBarber(true);
        setIsAdminLoading(false);
        // Update barber status to online
        updateBarberStatus(userId, 'online');
        return;
      }

      // Default to user role
      setUserRole('user');
      setIsAdmin(false);
      setIsBarber(false);
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole(null);
      setIsAdmin(false);
      setIsBarber(false);
    } finally {
      setIsAdminLoading(false);
    }
  }, [updateBarberStatus]);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change callback
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setIsAdmin(false);
          setIsBarber(false);
          setIsAdminLoading(false);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setIsAdminLoading(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkUserRole]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
    
    return { data };
  };

  const signOut = async () => {
    // NOTE: Logout does NOT change barber status (user preference)
    // Barber status is controlled only via the availability toggle
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast({
          title: 'Erro ao sair',
          description: 'Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error('Exception during signOut:', e);
    }
  };

  return {
    user,
    session,
    loading,
    userRole,
    isAdmin,
    isBarber,
    isAdminLoading,
    signIn,
    signOut,
  };
};
