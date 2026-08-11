import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface BarberFinanceRow {
  barberId: string;
  name: string;
  avatarUrl?: string | null;
  isActive?: boolean;
  commissionPercentage: number;
  attendances: number;
  revenue: number;
  commission: number;
  profit: number;
}

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

const money = (v: number) => `R$ ${v.toFixed(0)}`;

const Metric = ({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) => (
  <div className="min-w-0">
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={cn('text-sm font-bold break-words', valueClass)}>{value}</p>
  </div>
);

export const BarberFinanceCard = ({ row }: { row: BarberFinanceRow }) => {
  const empty = row.attendances === 0;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/10 p-3 transition-colors hover:bg-muted/20',
        empty && 'opacity-70'
      )}
    >
      <div className="flex items-center gap-3 sm:w-52 min-w-0">
        <Avatar className="h-12 w-12 border border-border/60 shrink-0">
          <AvatarImage src={row.avatarUrl || undefined} alt={`Foto de ${row.name}`} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
            {initials(row.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold break-words leading-tight">{row.name}</p>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {row.commissionPercentage}% comissão
            </Badge>
            {row.isActive === false && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                Inativo
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
        <Metric label="Atend." value={row.attendances} />
        <Metric label="Faturado" value={money(row.revenue)} valueClass="text-green-400" />
        <Metric label="Comissão" value={money(row.commission)} valueClass="text-orange-400" />
        <Metric label="Lucro loja" value={money(row.profit)} valueClass="text-primary" />
      </div>
    </div>
  );
};
