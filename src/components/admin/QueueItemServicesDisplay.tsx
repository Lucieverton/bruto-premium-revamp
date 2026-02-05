 import { useQueueItemServices } from '@/hooks/useQueue';
 import { Badge } from '@/components/ui/badge';
 import { Loader2 } from 'lucide-react';
 
 interface QueueItemServicesDisplayProps {
   queueItemId: string;
   compact?: boolean;
 }
 
 export const QueueItemServicesDisplay = ({ 
   queueItemId, 
   compact = false 
 }: QueueItemServicesDisplayProps) => {
   const { data: services, isLoading } = useQueueItemServices(queueItemId);
   
   if (isLoading) {
     return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
   }
   
   if (!services || services.length === 0) {
     return <span className="text-xs text-muted-foreground">Sem serviço</span>;
   }
   
   if (compact) {
     // Show just count and total
     const total = services.reduce((sum, s) => sum + Number(s.price_at_time), 0);
     return (
       <div className="flex items-center gap-1.5">
         <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 border-primary/30">
           {services.length} {services.length === 1 ? 'serviço' : 'serviços'}
         </Badge>
         <span className="text-xs font-medium text-primary">
           R$ {total.toFixed(2).replace('.', ',')}
         </span>
       </div>
     );
   }
   
   // Full display with service names
   return (
     <div className="space-y-1">
       {services.map((service, index) => (
         <div key={service.service_id} className="text-xs flex items-center justify-between gap-2">
           <span className="text-muted-foreground truncate">{service.service_name}</span>
           <span className="text-primary font-medium whitespace-nowrap">
             R$ {Number(service.price_at_time).toFixed(2).replace('.', ',')}
           </span>
         </div>
       ))}
       {services.length > 1 && (
         <div className="text-xs flex items-center justify-between gap-2 pt-1 border-t border-border/50">
           <span className="font-medium">Total:</span>
           <span className="text-primary font-bold">
             R$ {services.reduce((sum, s) => sum + Number(s.price_at_time), 0).toFixed(2).replace('.', ',')}
           </span>
         </div>
       )}
     </div>
   );
 };