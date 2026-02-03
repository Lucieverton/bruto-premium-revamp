import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChangeEmailFormProps {
  currentEmail: string;
}

export const ChangeEmailForm = ({ currentEmail }: ChangeEmailFormProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive',
      });
      return;
    }

    if (email.toLowerCase() === currentEmail.toLowerCase()) {
      toast({
        title: 'Mesmo email',
        description: 'O novo email é igual ao email atual.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email,
      });

      if (error) {
        console.error('Supabase updateUser error:', error);
        
        // Handle specific error messages
        let errorMessage = error.message;
        if (error.message.includes('email_exists')) {
          errorMessage = 'Este email já está em uso por outra conta.';
        } else if (error.message.includes('same_password')) {
          errorMessage = 'O novo email é igual ao atual.';
        } else if (error.message.includes('rate_limit') || error.message.includes('429')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos.';
        } else if (error.message.includes('invalid')) {
          errorMessage = 'Email inválido. Verifique o formato.';
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: 'Verifique seu email!',
        description: 'Enviamos um link de confirmação para o novo email. Clique no link para confirmar a alteração.',
      });

      setEmail('');
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        title: 'Erro ao alterar email',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail size={20} />
          Alterar Email
        </CardTitle>
        <CardDescription>
          Email atual: <span className="text-foreground">{currentEmail}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-email">Novo Email</Label>
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="novoemail@exemplo.com"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin mr-2" size={18} />}
            Alterar Email
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
