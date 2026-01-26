import { useState } from 'react';
import { Bell, Check, X, Clock, User, Phone, Scissors, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  usePendingQueueRequests, 
  useApproveQueueRequest, 
  useRejectQueueRequest 
} from '@/hooks/useQueueRequests';
import { useServices } from '@/hooks/useQueue';
import { useAdminBarbers } from '@/hooks/useAdminBarbers';
import { motion, AnimatePresence } from 'framer-motion';

export const QueueRequestsPanel = () => {
  const { data: requests, isLoading } = usePendingQueueRequests();
  const { data: services } = useServices();
  const { data: barbers } = useAdminBarbers();
  const approveRequest = useApproveQueueRequest();
  const rejectRequest = useRejectQueueRequest();
  
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return null;
    return services?.find(s => s.id === serviceId)?.name;
  };

  const getBarberName = (barberId: string | null) => {
    if (!barberId) return null;
    return barbers?.find(b => b.id === barberId)?.display_name;
  };

  const getRequesterName = (requestedBy: string) => {
    return barbers?.find(b => b.id === requestedBy)?.display_name || 'Barbeiro';
  };

  const handleApprove = (requestId: string) => {
    approveRequest.mutate({ requestId });
  };

  const handleRejectClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    setRejectNotes('');
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    if (selectedRequestId) {
      rejectRequest.mutate({ 
        requestId: selectedRequestId, 
        notes: rejectNotes || undefined 
      });
      setShowRejectDialog(false);
      setSelectedRequestId(null);
      setRejectNotes('');
    }
  };

  if (isLoading) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return null; // Don't show panel if no pending requests
  }

  return (
    <>
      <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-card to-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="relative">
              <Bell size={20} className="text-primary" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                {requests.length}
              </span>
            </div>
            Solicitações de Entrada
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <div className="space-y-3">
            <AnimatePresence>
              {requests.map((request, index) => {
                const serviceName = getServiceName(request.service_id);
                const barberName = getBarberName(request.barber_id);
                const requesterName = getRequesterName(request.requested_by);
                const created = new Date(request.created_at);
                const diffMins = Math.floor((Date.now() - created.getTime()) / 1000 / 60);
                
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-2">
                        {/* Requester Info */}
                        <div className="text-xs text-muted-foreground">
                          Solicitado por: <span className="text-primary font-medium">{requesterName}</span>
                          <span className="ml-2">• há {diffMins} min</span>
                        </div>
                        
                        {/* Customer Info */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <User size={14} className="text-muted-foreground" />
                            <span className="font-medium">{request.customer_name}</span>
                          </div>
                          
                          {request.priority === 'preferencial' && (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                              ⭐ Preferencial
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone size={12} />
                          {request.customer_phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                        </div>
                        
                        {/* Service & Barber */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {serviceName && (
                            <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded">
                              <Scissors size={10} />
                              {serviceName}
                            </span>
                          )}
                          {barberName && (
                            <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded">
                              Pref: {barberName}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectClick(request.id)}
                          disabled={rejectRequest.isPending}
                          className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                        >
                          <X size={14} className="mr-1" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={approveRequest.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {approveRequest.isPending ? (
                            <Loader2 size={14} className="animate-spin mr-1" />
                          ) : (
                            <Check size={14} className="mr-1" />
                          )}
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja rejeitar esta solicitação? Você pode adicionar uma observação opcional.
            </p>
            <Input
              placeholder="Motivo da rejeição (opcional)"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="bg-background"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRejectConfirm}
              disabled={rejectRequest.isPending}
              variant="destructive"
            >
              {rejectRequest.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : (
                <X size={14} className="mr-1" />
              )}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
