import { useState } from 'react';
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  barber: { id: string; display_name: string } | null;
  onClose: () => void;
}

export const EnableLoginDialog = ({ barber, onClose }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const close = () => { setEmail(''); setPassword(''); setShow(false); onClose(); };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!barber) throw new Error('Barbeiro inválido');
      if (password.length < 8 || !/\d/.test(password)) {
        throw new Error('A senha deve ter pelo menos 8 caracteres e incluir pelo menos 1 número');
      }
      const { data, error } = await supabase.functions.invoke('create-barber-user', {
        body: { barber_id: barber.id, email: email.trim(), password },
      });
      if (error) {
        let message = 'Erro ao ativar login';
        try {
          const ctx: any = (error as any).context;
          const body = ctx && typeof ctx.json === 'function' ? await ctx.json() : null;
          if (body?.error) message = body.error;
        } catch { /* ignore */ }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-barbers'] });
      toast({
        title: 'Login ativado!',
        description: `${barber?.display_name} já pode entrar no painel com o email e a senha cadastrados.`,
      });
      close();
    },
    onError: (e: Error) => {
      toast({ title: 'Não foi possível ativar', description: e.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={!!barber} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound size={18} className="text-primary" /> Ativar login
          </DialogTitle>
          <DialogDescription className="break-words">
            Crie o email e a senha para <strong>{barber?.display_name}</strong> acessar o painel pessoal.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        >
          <div className="space-y-2">
            <Label htmlFor="enable-email">Email</Label>
            <Input id="enable-email" type="email" required autoComplete="off"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@barbearia.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="enable-password">Senha</Label>
            <div className="relative">
              <Input id="enable-password" type={show ? 'text' : 'password'} required autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres e 1 número. Senhas muito comuns (ex.: "Teste12345") são recusadas.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin mr-2" size={18} />}
            Ativar login
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
