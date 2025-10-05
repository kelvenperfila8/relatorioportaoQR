import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Publication } from '@/types';
import { Loader2 } from 'lucide-react';

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publication: Publication | null;
  onStockAdjusted: (updatedPublication: Publication) => void;
}

const AdjustStockDialog = ({ open, onOpenChange, publication, onStockAdjusted }: AdjustStockDialogProps) => {
  const [newStock, setNewStock] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { logAction, showSuccessMessage, showErrorMessage } = useAuditLog();

  useEffect(() => {
    if (publication) {
      setNewStock(String(publication.current_stock));
    }
  }, [publication]);

  const handleAdjust = async () => {
    if (!publication || newStock === '' || isNaN(Number(newStock))) {
      toast({ title: 'Valor Inválido', description: 'Por favor, insira um número válido para o estoque.', variant: 'destructive' });
      return;
    }

    const newStockValue = Number(newStock);
    const oldStockValue = publication.current_stock;

    if (newStockValue === oldStockValue) {
        onOpenChange(false);
        return;
    }

    setProcessing(true);

    try {
      const { data: updatedPublication, error } = await supabase
        .from('publications')
        .update({ current_stock: newStockValue })
        .eq('id', publication.id)
        .select()
        .single();

      if (error) throw error;
      
      await logAction('update', 'publications', publication.id, 
        { current_stock: oldStockValue },
        { current_stock: newStockValue },
        `Ajuste manual de estoque`
      );

      showSuccessMessage('update', `Estoque de "${publication.name}" ajustado para ${newStockValue}.`);
      onStockAdjusted(updatedPublication);
      onOpenChange(false);

    } catch (error: any) {
      showErrorMessage('ajustar', 'estoque', error.message);
    } finally {
      setProcessing(false);
      setNewStock('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar Estoque</DialogTitle>
          <DialogDescription>
            Ajuste o valor de estoque para <span className="font-bold">{publication?.name}</span>.
            O valor atual é <span className="font-bold">{publication?.current_stock}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="new-stock">Novo valor do estoque</Label>
          <Input
            id="new-stock"
            type="number"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            placeholder="Digite a nova quantidade"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>Cancelar</Button>
          <Button onClick={handleAdjust} disabled={processing}>
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar Ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdjustStockDialog;