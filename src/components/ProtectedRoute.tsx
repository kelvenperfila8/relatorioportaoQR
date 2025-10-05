import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireReportAccess?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireReportAccess = false
}) => {
  const { user, loading, isAdmin, canEdit, canAccessReports } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se a rota exige permissão de admin/editor e o usuário não tem, redireciona para a home
  if (requireAdmin && !isAdmin && !canEdit) {
    return <Navigate to="/" replace />;
  }

  // Se a rota exige permissão de relatórios e o usuário não tem, redireciona para a home
  if (requireReportAccess && !canAccessReports) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};