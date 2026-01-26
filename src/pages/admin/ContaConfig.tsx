import { Settings } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { ChangeEmailForm } from '@/components/profile/ChangeEmailForm';
import { useAuth } from '@/contexts/AuthContext';

const ContaConfig = () => {
  const { user } = useAuth();

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Settings className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl uppercase">Configurações da Conta</h1>
            <p className="text-sm text-muted-foreground">Altere seu email e senha</p>
          </div>
        </div>

        {/* Account Settings */}
        <div className="grid gap-4 md:grid-cols-2">
          <ChangeEmailForm currentEmail={user?.email || ''} />
          <ChangePasswordForm />
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContaConfig;
