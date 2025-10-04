import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, Plus, Search, Edit, Trash2, Download, Settings, Loader2, MoreVertical, QrCode, Camera, Link } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CodeBadge } from "@/components/ui/code-badge";
import { PublicationFormDialog } from "@/components/PublicationFormDialog";
import { PublicationCover } from "@/components/PublicationCover";
import QrCodeScanner from '@/components/QrCodeScanner';

import { useAuth } from '@/contexts/AuthContext';
import { Publication } from "@/types";

const normalizeText = (text: string = ''): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
};

const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
};

const formatCsvValue = (value: any): string => {
  const stringValue = String(value ?? '');
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const GerenciarSimplified = () => {
  const { canCreate, canEdit, canDelete } = useAuth();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scanResult, setScanResult] = useState<Publication | null>(null);
  
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publicationToDelete, setPublicationToDelete] = useState<Publication | null>(null);
  
  const [urlPublication, setUrlPublication] = useState<Publication | null>(null);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [publicationUrl, setPublicationUrl] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const [processing, setProcessing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{url: string, title: string} | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPublications();
  }, []);

  const loadPublications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('publications').select('*').order('category, name');
      if (error) throw error;
      setPublications(data || []);
      // toast({ title: "Sucesso", description: "Publicações carregadas." });
    } catch (error) {
      console.error('Erro ao carregar publicações:', error);
      toast({ title: "Erro", description: "Não foi possível carregar as publicações.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeletePublication = async () => {
    if (!publicationToDelete) return;
    try {
      setProcessing(true);
      const { error } = await supabase.from('publications').delete().eq('id', publicationToDelete.id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Publicação excluída." });
      setDeleteDialogOpen(false);
      loadPublications();
    } catch (error) {
      console.error('Erro ao excluir publicação:', error);
      toast({ title: "Erro", description: "Não foi possível excluir a publicação.", variant: "destructive" });
    } finally {
      setProcessing(false);
      setPublicationToDelete(null);
    }
  };

  const handleSaveUrl = async () => {
    if (!urlPublication || !isValidUrl(publicationUrl)) {
      toast({ title: "URL Inválida", description: "Por favor, insira uma URL válida.", variant: "destructive" });
      return;
    }
    try {
      setProcessing(true);
      const { error } = await supabase
        .from('publications')
        .update({ urlDoFabricante: publicationUrl })
        .eq('id', urlPublication.id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "URL salva com sucesso." });
      setUrlDialogOpen(false);
      loadPublications();
    } catch (error) {
      console.error('Erro ao salvar URL:', error);
      toast({ title: "Erro", description: "Não foi possível salvar a URL.", variant: "destructive" });
    } finally {
      setProcessing(false);
      setUrlPublication(null);
      setPublicationUrl("");
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.from('publications').select('code,name,category,current_stock').order('name');
      if (error) throw error;

      const headers = ["Código", "Nome", "Categoria", "Estoque Atual"];
      const csvRows = [];
      csvRows.push(headers.join(','));

      for (const row of data) {
        const values = [row.code, row.name, row.category, row.current_stock].map(formatCsvValue);
        csvRows.push(values.join(','));
      }
      
      const csvString = "sep=,\n" + csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `publicacoes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Sucesso", description: "Publicações exportadas para CSV." });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({ title: "Erro", description: "Não foi possível exportar as publicações para CSV.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredPublications = publications.filter(pub => {
    const normalizedSearch = normalizeText(searchTerm);
    const matchesName = () => normalizeText(pub.name).includes(normalizedSearch);
    const matchesCode = () => normalizeText(pub.code) === normalizedSearch;
    const matchesUrl = () => pub.urlDoFabricante && normalizeText(pub.urlDoFabricante).includes(normalizedSearch);

    return (
      (categoryFilter === "all" || pub.category === categoryFilter) &&
      (matchesName() || matchesCode() || matchesUrl())
    );
  });
  
  const displayedPublications = scanResult ? [scanResult] : filteredPublications;
  const categories = Array.from(new Set(publications.map(p => p.category))).sort();

  const handleScanSuccess = (scannedValue: string) => {
    setIsScannerOpen(false);
    
    // Prioritize exact matches for QR codes and URLs
    const foundPublication = publications.find(pub => 
      pub.urlDoFabricante === scannedValue || 
      pub.codigoExternoQR === scannedValue ||
      pub.code === scannedValue
    );

    if (foundPublication) {
      setScanResult(foundPublication);
      setSearchTerm("");
      toast({
        title: "Publicação Encontrada",
        description: `Exibindo "${foundPublication.name}".`,
      });
    } else {
      setScanResult(null);
      setSearchTerm(scannedValue); // Keep the scanned value in the search bar if not found
      toast({
        title: "Publicação Não Encontrada",
        description: "O código lido foi inserido no campo de busca.",
        variant: "destructive",
      });
    }
  };


  const handleOpenCamera = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIsScannerOpen(prev => !prev);
  };
  
  const openNewPublicationDialog = () => {
    setEditingPublication(null);
    setShowNewForm(true);
  };

  if (loading) { return <div>Carregando...</div>; }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciar Catálogo</h1>
        <p className="text-muted-foreground">Adicione, edite e organize suas publicações.</p>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsContent value="catalog" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código, nome ou URL..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setScanResult(null);
                    }}
                    className="pl-10 pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={handleOpenCamera}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Select 
                  value={categoryFilter} 
                  onValueChange={(value) => {
                    setCategoryFilter(value);
                    setScanResult(null);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={handleExportCSV} variant="outline" className="w-full md:w-auto" disabled={isExporting}>
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Exportar CSV
                </Button>
                {canCreate && (
                  <Button onClick={openNewPublicationDialog} className="w-full md:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Publicação
                  </Button>
                )}
              </div>
              {isScannerOpen && (
                <div className="relative mt-4">
                  <QrCodeScanner
                    onScan={handleScanSuccess}
                    onClose={() => setIsScannerOpen(false)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Publicações</CardTitle>
            </CardHeader>
            <CardContent>
              {displayedPublications.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Nenhuma publicação encontrada.</p>
                </div>
              ) : (
                <div className="rounded-lg border">
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Capa</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedPublications.map((pub) => (
                        <TableRow key={pub.id}>
                           <TableCell>
                             <PublicationCover 
                               imageUrl={pub.image_url} 
                               title={pub.name}
                               className="w-12 h-16"
                               onClick={() => pub.image_url && setZoomedImage({url: pub.image_url, title: pub.name})}
                             />
                           </TableCell>
                          <TableCell><CodeBadge code={pub.code || 'N/A'} /></TableCell>
                          <TableCell className="font-medium">{pub.name}</TableCell>
                          <TableCell><Badge variant="secondary">{pub.category}</Badge></TableCell>
                          <TableCell>{pub.current_stock}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditingPublication(pub); setEditDialogOpen(true); }}>
                                  <Edit className="mr-2 h-4 w-4" />Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setUrlPublication(pub); setPublicationUrl(pub.urlDoFabricante || ""); setUrlDialogOpen(true); }}>
                                  <Link className="mr-2 h-4 w-4" />Cadastrar URL
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setPublicationToDelete(pub); setDeleteDialogOpen(true); }} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Diálogos */}
      <PublicationFormDialog open={showNewForm} onOpenChange={setShowNewForm} onSuccess={loadPublications} publication={null} />
      <PublicationFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} publication={editingPublication} onSuccess={() => { loadPublications(); setEditDialogOpen(false); }} />
      
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar URL para "{urlPublication?.name}"</DialogTitle>
            <DialogDescription>
              Insira a URL do fabricante ou outra URL de referência para esta publicação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pub-url">URL</Label>
            <Input 
              id="pub-url" 
              value={publicationUrl}
              onChange={(e) => setPublicationUrl(e.target.value)}
              placeholder="https://exemplo.com/produto"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUrlDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveUrl} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a publicação "{publicationToDelete?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeletePublication} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {zoomedImage && (
        <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{zoomedImage.title}</DialogTitle>
            </DialogHeader>
            <img src={zoomedImage.url} alt={zoomedImage.title} className="w-full h-auto rounded-md" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GerenciarSimplified;
