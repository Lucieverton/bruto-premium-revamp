import { useState, useMemo } from 'react';
import { Check, Plus, X, Scissors } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Service } from '@/hooks/useQueue';

interface MultiServiceSelectorProps {
  services: Service[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  compact?: boolean;
}

export const MultiServiceSelector = ({
  services,
  selectedIds,
  onChange,
  compact = false,
}: MultiServiceSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleService = (serviceId: string) => {
    if (selectedIds.includes(serviceId)) {
      onChange(selectedIds.filter((id) => id !== serviceId));
    } else {
      onChange([...selectedIds, serviceId]);
    }
  };
  
  const totalPrice = useMemo(() => {
    return services
      .filter((s) => selectedIds.includes(s.id))
      .reduce((sum, s) => sum + s.price, 0);
  }, [services, selectedIds]);
  
  const totalDuration = useMemo(() => {
    return services
      .filter((s) => selectedIds.includes(s.id))
      .reduce((sum, s) => sum + s.duration_minutes, 0);
  }, [services, selectedIds]);
  
  const selectedServices = services.filter((s) => selectedIds.includes(s.id));
  
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {services.map((service) => {
            const isSelected = selectedIds.includes(service.id);
            return (
              <Badge
                key={service.id}
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-all text-xs py-1 px-2',
                  isSelected
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:bg-muted'
                )}
                onClick={() => toggleService(service.id)}
              >
                {isSelected && <Check size={12} className="mr-1" />}
                {service.name}
              </Badge>
            );
          })}
        </div>
        
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
            <span className="text-muted-foreground">
              {selectedIds.length} serviço(s) • ~{totalDuration}min
            </span>
            <span className="font-bold text-primary">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* Selected Services Summary */}
      {selectedIds.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Serviços selecionados:</span>
            <span className="font-bold text-primary text-lg">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedServices.map((service) => (
              <Badge
                key={service.id}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {service.name}
                <button
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Duração estimada: ~{totalDuration} minutos
          </div>
        </div>
      )}
      
      {/* Service Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {services.slice(0, isExpanded ? undefined : 6).map((service) => {
          const isSelected = selectedIds.includes(service.id);
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => toggleService(service.id)}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-all text-left',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-2">
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={12} className="text-primary-foreground" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                )}
                <div>
                  <p className="font-medium text-sm">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.duration_minutes}min</p>
                </div>
              </div>
              <span className={cn(
                'font-semibold text-sm',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )}>
                R$ {service.price.toFixed(2).replace('.', ',')}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Show More Button */}
      {services.length > 6 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          {isExpanded ? 'Ver menos' : `Ver mais ${services.length - 6} serviços`}
        </Button>
      )}
      
      {selectedIds.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Selecione um ou mais serviços (opcional)
        </p>
      )}
    </div>
  );
};