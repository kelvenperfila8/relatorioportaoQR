import SupabaseConfig from "@/components/SupabaseConfig";
import { Database } from "lucide-react";

const AdminSupabase = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6" />
              Configuração do Supabase
            </h2>
            <p className="text-muted-foreground">
              Gerencie a conexão com a sua instância do Supabase.
            </p>
          </div>
        </div>
        <SupabaseConfig />
      </div>
    </div>
  );
};

export default AdminSupabase;
