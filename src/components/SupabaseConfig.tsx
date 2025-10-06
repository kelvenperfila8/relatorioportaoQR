
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, PowerOff, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SupabaseConfig = () => {
  const { toast } = useToast();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUrl = localStorage.getItem('supabaseUrl');
    const storedKey = localStorage.getItem('supabaseKey');
    if (storedUrl && storedKey) {
      setIsConnected(true);
      setSupabaseUrl(storedUrl);
    }
  }, []);

  const handleConnect = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setError("A URL do projeto e a chave da API são obrigatórias.");
      return;
    }
    setError(null);
    setIsConnecting(true);

    try {
      const testClient = createClient(supabaseUrl, supabaseKey);
      // Testa a ligação fazendo uma pequena consulta. Pede as tabelas do schema 'storage'.
      const { error: testError } = await testClient.from('clientes').select('*').limit(1);

      if (testError && testError.message !== 'relation "public.clientes" does not exist') {
        // Ignora o erro se a tabela 'clientes' não existir,
        // mas falha noutros erros (ex: autenticação inválida)
        throw testError;
      }
      
      localStorage.setItem('supabaseUrl', supabaseUrl);
      localStorage.setItem('supabaseKey', supabaseKey);

      toast({
        title: "Sucesso!",
        description: "A ligação ao Supabase foi configurada com sucesso.",
      });

      // Recarrega a página para reinicializar o cliente Supabase principal
      setTimeout(() => window.location.reload(), 1000);

    } catch (e: any) {
      console.error("Falha na ligação ao Supabase:", e);
      setError(`Falha na ligação: ${e.message}. Verifique as suas credenciais e as políticas de RLS.`);
      toast({
        title: "Erro de Ligação",
        description: "Não foi possível ligar ao Supabase. Verifique a consola para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('supabaseUrl');
    localStorage.removeItem('supabaseKey');
    toast({
      title: "Desligado",
      description: "A ligação com o Supabase foi removida.",
    });
    setTimeout(() => window.location.reload(), 1000);
  };

  const getObfuscatedUrl = () => {
    try {
      const url = new URL(supabaseUrl);
      const hostnameParts = url.hostname.split('.');
      if (hostnameParts.length > 2) {
        return `${url.protocol}//${hostnameParts[0].substring(0, 4)}...${hostnameParts.slice(-2).join('.')}`;
      }
      return supabaseUrl;
    } catch {
      return 'URL inválida';
    }
  };

  if (isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg border-green-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-green-500">
            <CheckCircle size={24} />
            <span>Ligado ao Supabase</span>
          </CardTitle>
          <CardDescription>
            O sistema está a comunicar com o seu projeto Supabase em: <span className="font-semibold text-primary">{getObfuscatedUrl()}</span>
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Dashboard do Supabase
                </a>
            </Button>
            <Button onClick={handleDisconnect} variant="destructive">
              <PowerOff className="mr-2 h-4 w-4" />
              Desligar
            </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md border-border">
        <CardHeader>
            <CardTitle className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-primary" />
                <span>Ligar ao Supabase</span>
            </CardTitle>
            <CardDescription>
                Insira as credenciais do seu projeto Supabase para ativar a integração de dados em tempo real.
            </CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Erro na Ligação</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="supabase-url">URL do Projeto</Label>
          <Input
            id="supabase-url"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            placeholder="https://[ID-DO-PROJETO].supabase.co"
            disabled={isConnecting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supabase-key">Chave Pública (anon key)</Label>
          <Input
            id="supabase-key"
            type="password"
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            disabled={isConnecting}
          />
        </div>
         <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1.5">
            <ExternalLink size={14} />
            Onde encontro as minhas chaves?
        </a>
      </CardContent>
      <CardFooter>
        <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
          {isConnecting ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A ligar...
            </>
          ) : 'Ligar e Guardar'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SupabaseConfig;
