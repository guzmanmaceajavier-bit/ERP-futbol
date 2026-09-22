import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Jugadores } from './pages/jugadores/Jugadores';
import { Pagos } from './pages/pagos/Pagos';
import { Categorias } from './pages/categorias/Categorias';
import { Asistencias } from './pages/asistencias/Asistencias';
import { Profesores } from './pages/profesores/Profesores';
import { Caja } from './pages/caja/Caja';
import { Gastos } from './pages/gastos/Gastos';
import { Inventario } from './pages/inventario/Inventario';
import { Torneos } from './pages/torneos/Torneos';
import { Alertas } from './pages/alertas/Alertas';
import { WhatsApp } from './pages/whatsapp/WhatsApp';
import { Notas } from './pages/notas/Notas';
import { Bitacora } from './pages/bitacora/Bitacora';
import { Reportes } from './pages/reportes/Reportes';
import { Configuracion } from './pages/configuracion/Configuracion';
import { Entrenamientos } from './pages/entrenamientos/Entrenamientos';
import { Partidos } from './pages/partidos/Partidos';
import { Convocatorias } from './pages/convocatorias/Convocatorias';
import type { UserRole } from './types';
import { LoadingOverlay } from './components/feedback/LoadingOverlay';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingOverlay />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleGuard({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />

      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />

        <Route path="jugadores" element={<RoleGuard roles={['super_admin', 'admin', 'tesorero', 'entrenador', 'profe', 'auxiliar', 'asistente']}><Jugadores /></RoleGuard>} />
        <Route path="categorias" element={<RoleGuard roles={['super_admin', 'admin', 'entrenador', 'profe']}><Categorias /></RoleGuard>} />
        <Route path="profesores" element={<RoleGuard roles={['super_admin', 'admin']}><Profesores /></RoleGuard>} />
        <Route path="asistencias" element={<RoleGuard roles={['super_admin', 'admin', 'tesorero', 'entrenador', 'profe', 'auxiliar', 'asistente']}><Asistencias /></RoleGuard>} />
        <Route path="torneos" element={<RoleGuard roles={['super_admin', 'admin', 'entrenador', 'profe']}><Torneos /></RoleGuard>} />

        <Route path="entrenamientos" element={<RoleGuard roles={['super_admin', 'admin', 'entrenador', 'profe']}><Entrenamientos /></RoleGuard>} />
        <Route path="partidos" element={<RoleGuard roles={['super_admin', 'admin', 'entrenador', 'profe']}><Partidos /></RoleGuard>} />
        <Route path="convocatorias" element={<RoleGuard roles={['super_admin', 'admin', 'entrenador', 'profe']}><Convocatorias /></RoleGuard>} />

        <Route path="pagos" element={<RoleGuard roles={['super_admin', 'admin', 'tesorero']}><Pagos /></RoleGuard>} />
        <Route path="caja" element={<RoleGuard roles={['super_admin', 'admin', 'tesorero']}><Caja /></RoleGuard>} />
        <Route path="gastos" element={<RoleGuard roles={['super_admin', 'admin', 'tesorero']}><Gastos /></RoleGuard>} />
        <Route path="reportes" element={<RoleGuard roles={['super_admin', 'admin', 'tesorero']}><Reportes /></RoleGuard>} />

        <Route path="inventario" element={<RoleGuard roles={['super_admin', 'admin', 'auxiliar', 'asistente', 'tesorero']}><Inventario /></RoleGuard>} />
        <Route path="notas" element={<RoleGuard roles={['super_admin', 'admin', 'entrenador', 'profe']}><Notas /></RoleGuard>} />

        <Route path="alertas" element={<RoleGuard roles={['super_admin', 'admin', 'tesorero']}><Alertas /></RoleGuard>} />
        <Route path="whatsapp" element={<RoleGuard roles={['super_admin', 'admin', 'tesorero']}><WhatsApp /></RoleGuard>} />
        <Route path="bitacora" element={<RoleGuard roles={['super_admin']}><Bitacora /></RoleGuard>} />
        <Route path="configuracion" element={<RoleGuard roles={['super_admin']}><Configuracion /></RoleGuard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
