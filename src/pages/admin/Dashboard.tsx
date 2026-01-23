import { AdminLayout } from '@/components/admin/AdminLayout';
import { QueueMetricsCards } from '@/components/admin/QueueMetricsCards';
import { AddWalkInForm } from '@/components/admin/AddWalkInForm';
import { QueueKanban } from '@/components/admin/QueueKanban';
import { useQueueRealtime, useQueueSettingsRealtime } from '@/hooks/useQueueRealtime';

const AdminDashboard = () => {
  // Enable realtime updates
  useQueueRealtime();
  useQueueSettingsRealtime();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-display text-2xl uppercase">Gestão da Fila</h1>
          <AddWalkInForm />
        </div>
        
        <QueueMetricsCards />
        
        <QueueKanban />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
