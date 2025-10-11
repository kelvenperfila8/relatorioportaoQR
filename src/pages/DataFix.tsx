import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DataFixPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFixCategories = async () => {
    setLoading(true);
    setResult(null);

    const incorrectCategory = "Revistas - Sentinela";
    const correctCategory = "Revistas — Sentinela";

    try {
      // 1. Encontrar todas as publicações com a categoria incorreta
      const { data: publicationsToFix, error: fetchError } = await supabase
        .from('publications')
        .select('id, name')
        .eq('category', incorrectCategory);

      if (fetchError) {
        throw new Error(`Erro ao buscar publicações: ${fetchError.message}`);
      }

      if (!publicationsToFix || publicationsToFix.length === 0) {
        setResult("Nenhuma publicação encontrada com a categoria duplicada 'Revistas - Sentinela'. Nenhuma ação foi necessária.");
        setLoading(false);
        return;
      }

      // 2. Atualizar as publicações encontradas para a categoria correta
      const { error: updateError, count } = await supabase
        .from('publications')
        .update({ category: correctCategory })
        .in('id', publicationsToFix.map(p => p.id));

      if (updateError) {
        throw new Error(`Erro ao atualizar publicações: ${updateError.message}`);
      }

      setResult(`Correção concluída com sucesso! ${count} publicações foram atualizadas da categoria incorreta para a correta.`);
      toast({ title: "Sucesso!", description: "Os dados foram corrigidos." });

    } catch (error: any) {
      console.error("Erro na operação de correção:", error);
      setResult(`Ocorreu um erro: ${error.message}`);
      toast({ title: "Erro na Correção", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 flex justify-center items-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Correção de Dados</CardTitle>
          <CardDescription>
            Esta página executa uma correção no banco de dados para unificar categorias de publicações duplicadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            <strong>Ação:</strong> O script irá procurar por publicações na categoria <strong>"Revistas - Sentinela"</strong> (com hífen) e irá movê-las para a categoria correta <strong>"Revistas — Sentinela"</strong> (com travessão).
          </p>
          {result && (
            <div className="mt-4 p-3 rounded-md bg-secondary text-secondary-foreground text-sm">
              <p>{result}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleFixCategories} disabled={loading}>
            {loading ? "Corrigindo..." : "Corrigir Categorias Duplicadas"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DataFixPage;
