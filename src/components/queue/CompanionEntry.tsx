import { useState } from 'react';
import { X, CheckCircle2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Service, PublicBarber } from '@/hooks/useQueue';

export interface CompanionData {
  name: string;
  service_ids: string[];
  barber_id: string; // '' means same as leader
}

interface CompanionEntryProps {
  index: number;
  companion: CompanionData;
  services: Service[];
  barbers: PublicBarber[];
  leaderBarberId: string;
  leaderBarberName: string;
  onChange: (data: CompanionData) => void;
  onRemove: () => void;
}

export const CompanionEntry = ({
  index,
  companion,
  services,
  barbers,
  leaderBarberId,
  leaderBarberName,
  onChange,
  onRemove,
}: CompanionEntryProps) => {
  const [showServices, setShowServices] = useState(false);

  const selectedServices = services.filter(s => companion.service_ids.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const handleServiceToggle = (serviceId: string) => {
    const newIds = companion.service_ids.includes(serviceId)
      ? companion.service_ids.filter(id => id !== serviceId)
      : [...companion.service_ids, serviceId];
    onChange({ ...companion, service_ids: newIds });
  };

  const effectiveBarberName = companion.barber_id
    ? barbers.find(b => b.id === companion.barber_id)?.display_name?.split(' ')[0] || ''
    : leaderBarberName.split(' ')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-3 bg-muted/30 border border-border rounded-lg space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          👤 Acompanhante {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:bg-destructive/10"
          onClick={onRemove}
        >
          <X size={14} />
        </Button>
      </div>

      {/* Name */}
      <div className="space-y-1">
        <Label className="text-xs">Nome *</Label>
        <Input
          placeholder="Nome do acompanhante"
          value={companion.name}
          onChange={(e) => onChange({ ...companion, name: e.target.value })}
          className="bg-background h-9 text-sm"
        />
      </div>

      {/* Barber Selection */}
      <div className="space-y-1">
        <Label className="text-xs">Barbeiro</Label>
        <Select
          value={companion.barber_id || 'same'}
          onValueChange={(val) => onChange({ ...companion, barber_id: val === 'same' ? '' : val })}
        >
          <SelectTrigger className="bg-background h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="same">
              Mesmo barbeiro ({leaderBarberName.split(' ')[0]})
            </SelectItem>
            {barbers
              .filter(b => b.id !== leaderBarberId && (b.status === 'online' || b.status === 'busy'))
              .map(b => (
                <SelectItem key={b.id} value={b.id}>
                  <span className="flex items-center gap-2">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      b.status === 'online' ? 'bg-green-500' : 'bg-orange-500'
                    )} />
                    {b.display_name.split(' ')[0]}
                  </span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Services Toggle */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowServices(!showServices)}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showServices ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Serviços ({selectedServices.length} selecionado{selectedServices.length !== 1 ? 's' : ''})
          {totalPrice > 0 && (
            <span className="ml-1 text-primary font-semibold">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showServices && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 gap-1.5 max-h-[180px] overflow-y-auto"
            >
              {services.map(service => {
                const isSelected = companion.service_ids.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleServiceToggle(service.id)}
                    className={cn(
                      'p-2 rounded-md border text-left transition-all text-xs',
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border bg-card hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                          <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="leading-tight">{service.name}</span>
                      </div>
                      <span className="font-semibold text-primary whitespace-nowrap">
                        R$ {service.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected services badges */}
        {!showServices && selectedServices.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedServices.map(s => (
              <Badge key={s.id} variant="outline" className="text-[10px] bg-background">
                {s.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
