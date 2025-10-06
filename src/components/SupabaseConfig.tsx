import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Zap, PowerOff, CheckCircle, ExternalLink } from "lucide-react";

const SupabaseConfig = () => {
  const { toast } = useToast();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const storedUrl = localStorage.getItem('supabaseUrl');
    const storedKey = localStorage.getItem('supabaseKey');
    if (storedUrl && storedKey) {
      setIsConnected(true);
      setSupabaseUrl(storedUrl);
    }
  }, []);

  const handleConnect = () => {
    if (supabaseUrl && supabaseKey) {
      localStorage.setItem('supabaseUrl', supabaseUrl);
      localStorage.setItem('supabaseKey', supabaseKey);
      toast({
        title: "Conexão estabelecida!",
        description: "A integração com o Supabase foi configurada com sucesso.",
      });
      setIsDialogOpen(false);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast({
        title: "Campos inválidos",
        description: "Por favor, preencha a URL do projeto e a chave API.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('supabaseUrl');
    localStorage.removeItem('supabaseKey');
    toast({
      title: "Desconectado",
      description: "A conexão com o Supabase foi removida.",
    });
    setTimeout(() => window.location.reload(), 1500);
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
  }

  if (isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg border-green-500/20">
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-500">
              <CheckCircle size={24} />
              <span>Conectado ao Supabase</span>
            </CardTitle>
            <CardDescription>
              O sistema está a comunicar com segurança com o seu projeto Supabase.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>URL do Projeto</Label>
                <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <span>{getObfuscatedUrl()}</span>
                </div>
            </div>
            <Button onClick={handleDisconnect} variant="destructive" className="w-full mt-4">
              <PowerOff className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md">
      <CardContent className="p-10 text-center">
        <div className="mx-auto w-fit rounded-full bg-primary/10 p-4 mb-6">
           <Zap className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Conectar com Supabase</h2>
        <p className="text-muted-foreground mb-8">
          Integre a sua conta Supabase para sincronizar dados e gerir o seu backend.
        </p>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full max-w-xs mx-auto shadow-lg bg-gradient-to-r from-primary to-primary-variant text-primary-foreground">
              <Zap className="mr-2 h-5 w-5" />
              Conectar Agora
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Configurar Conexão</DialogTitle>
              <DialogDescription>
                Para encontrar estas chaves, vá para as configurações de API do seu projeto no painel do Supabase.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="supabase-url">URL do Projeto</Label>
                <Input
                  id="supabase-url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://[ID-DO-PROJETO].supabase.co"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supabase-key">Chave Pública (anon key)</Label>
                <Input
                  id="supabase-key"
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="Cole a sua chave anônima pública"
                />
              </div>
              <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1.5">
                <ExternalLink size={14} />
                Onde encontro as minhas chaves?
              </a>
            </div>
            <DialogFooter>
              <Button onClick={handleConnect} type="submit" className="w-full">
                Salvar e Conectar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
};

export default SupabaseConfig;
