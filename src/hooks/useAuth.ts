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
  }, []);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkUserRole(session.user.id);
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkUserRole(session.user.id);
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Erro ao sair',
        description: error.message,
        variant: 'destructive',
      });
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
