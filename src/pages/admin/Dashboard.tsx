import { AdminLayout } from '@/components/admin/AdminLayout';
import { QueueMetricsCards } from '@/components/admin/QueueMetricsCards';
import { AddWalkInForm } from '@/components/admin/AddWalkInForm';
import { QueueKanban } from '@/components/admin/QueueKanban';
import { ActiveServicesAdmin } from '@/components/admin/ActiveServicesAdmin';
import { useQueueRealtime, useQueueSettingsRealtime, useBarbersRealtime } from '@/hooks/useQueueRealtime';

const AdminDashboard = () => {
  // Enable realtime updates
  useQueueRealtime();
  useQueueSettingsRealtime();
  useBarbersRealtime();

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header - Stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h1 className="font-display text-xl sm:text-2xl uppercase">Gestão da Fila</h1>
          <AddWalkInForm />
        </div>
        
        <QueueMetricsCards />
        
        {/* Active Services Display */}
        <ActiveServicesAdmin />
        
        <QueueKanban />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
