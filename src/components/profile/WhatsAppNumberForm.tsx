import { useState } from 'react';
import { Phone, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppNumberFormProps {
  barberId: string;
  currentNumber: string | null;
}

export const WhatsAppNumberForm = ({ barberId, currentNumber }: WhatsAppNumberFormProps) => {
  const [whatsappNumber, setWhatsappNumber] = useState(currentNumber || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateWhatsApp = useMutation({
    mutationFn: async (number: string) => {
      // Normalize: remove non-digits
      const normalized = number.replace(/\D/g, '');
      
      const { error } = await supabase
        .from('barbers')
        .update({ whatsapp_number: normalized || null })
        .eq('id', barberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
      toast({
        title: '✅ WhatsApp atualizado!',
        description: 'Os clientes poderão entrar em contato pelo número salvo.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneDisplay(e.target.value);
    setWhatsappNumber(formatted);
  };

  const handleSave = () => {
    updateWhatsApp.mutate(whatsappNumber);
  };

  return (
    <Card className="bg-gradient-to-br from-card to-green-500/5 border-green-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="p-1.5 bg-green-500/20 rounded-lg">
            <Phone size={16} className="text-green-500" />
          </div>
          WhatsApp para Clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Clientes da sua fila poderão entrar em contato com você por este número.
        </p>
        
        <div className="flex gap-2">
          <Input
            type="tel"
            placeholder="(00) 00000-0000"
            value={whatsappNumber}
            onChange={handleChange}
            maxLength={16}
            className="flex-1"
          />
          <Button
            onClick={handleSave}
            disabled={updateWhatsApp.isPending}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {updateWhatsApp.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
