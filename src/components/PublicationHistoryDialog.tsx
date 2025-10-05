import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Publication, AuditLog } from '@/types';
import { Loader2, History } from 'lucide-react';

interface PublicationHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publication: Publication | null;
}

const PublicationHistoryDialog = ({ open, onOpenChange, publication }: PublicationHistoryDialogProps) => {
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!publication) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*, users (full_name)')
          .eq('record_id', publication.id)
          .or('action.eq.movement,action.eq.update')
          .order('timestamp', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching publication history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchHistory();
    }
  }, [open, publication]);

  const renderDetails = (log: AuditLog) => {
    if (log.action === 'movement' && log.details) {
        const details = log.details as { movement_type: string, quantity: number };
        const movementType = details.movement_type === 'entrada' ? 'Entrada' : 'Saída';
        const quantity = details.quantity;
        return <Badge variant={movementType === 'Entrada' ? 'default' : 'secondary'} className={movementType === 'Entrada' ? 'bg-blue-500' : 'bg-red-500'}>{`${movementType}: ${quantity}`}</Badge>;
    } 
    if (log.action === 'update' && log.changed_data && log.details === 'Ajuste manual de estoque') {
        const oldStock = (log.changed_data as any)?.old?.current_stock;
        const newStock = (log.changed_data as any)?.new?.current_stock;
        return <Badge variant='outline'>{`Ajuste: ${oldStock} → ${newStock}`}</Badge>;
    }
    return <span>{log.details || 'Detalhes não disponíveis'}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Histórico da Publicação</DialogTitle>
          <DialogDescription>Histórico de movimentações e ajustes para <span className='font-bold'>{publication?.name}</span>.</DialogDescription>
        </DialogHeader>
        <div className="-mx-4 md:mx-0 max-h-[60vh] overflow-y-auto mt-4 pr-2">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{log.users?.full_name || 'Sistema'}</TableCell>
                    <TableCell>{renderDetails(log)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
                <History className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Nenhum histórico encontrado para esta publicação.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublicationHistoryDialog;
