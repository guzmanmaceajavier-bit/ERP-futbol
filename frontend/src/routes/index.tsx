import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';
import { LoadingOverlay } from '../components/feedback/LoadingOverlay';
import type { UserRole } from '../types';

import { Login } from '../pages/auth/Login';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { Jugadores } from '../pages/jugadores/Jugadores';
import { Pagos } from '../pages/pagos/Pagos';
import { Categorias } from '../pages/categorias/Categorias';
import { Asistencias } from '../pages/asistencias/Asistencias';
import { Profesores } from '../pages/profesores/Profesores';
import { Caja } from '../pages/caja/Caja';
import { Gastos } from '../pages/gastos/Gastos';
import { Inventario } from '../pages/inventario/Inventario';
import { Torneos } from '../pages/torneos/Torneos';
import { Alertas } from '../pages/alertas/Alertas';
import { WhatsApp } from '../pages/whatsapp/WhatsApp';
import { Notas } from '../pages/notas/Notas';
import { Bitacora } from '../pages/bitacora/Bitacora';
import { Reportes } from '../pages/reportes/Reportes';
import { Configuracion } from '../pages/configuracion/Configuracion';
import { Entrenamientos } from '../pages/entrenamientos/Entrenamientos';
import { Partidos } from '../pages/partidos/Partidos';
import { Convocatorias } from '../pages/convocatorias/Convocatorias';

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

const TODOS: UserRole[] = ['super_admin', 'admin', 'tesorero', 'entrenador', 'profe', 'auxiliar', 'asistente'];
const DINERO: UserRole[] = ['super_admin', 'admin', 'tesorero'];
const DEPORTE: UserRole[] = ['super_admin', 'admin', 'entrenador', 'profe'];

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />

      <Route path="/" element={<ProtectedRoute><ErrorBoundary><MainLayout /></ErrorBoundary></ProtectedRoute>}>
        <Route index element={<RoleGuard roles={TODOS}><Dashboard /></RoleGuard>} />

        <Route path="jugadores" element={<RoleGuard roles={TODOS}><Jugadores /></RoleGuard>} />
        <Route path="categorias" element={<RoleGuard roles={DEPORTE}><Categorias /></RoleGuard>} />
        <Route path="profesores" element={<RoleGuard roles={['super_admin', 'admin']}><Profesores /></RoleGuard>} />
        <Route path="asistencias" element={<RoleGuard roles={TODOS}><Asistencias /></RoleGuard>} />
        <Route path="torneos" element={<RoleGuard roles={DEPORTE}><Torneos /></RoleGuard>} />

        <Route path="entrenamientos" element={<RoleGuard roles={DEPORTE}><Entrenamientos /></RoleGuard>} />
        <Route path="partidos" element={<RoleGuard roles={DEPORTE}><Partidos /></RoleGuard>} />
        <Route path="convocatorias" element={<RoleGuard roles={DEPORTE}><Convocatorias /></RoleGuard>} />

        <Route path="pagos" element={<RoleGuard roles={DINERO}><Pagos /></RoleGuard>} />
        <Route path="caja" element={<RoleGuard roles={DINERO}><Caja /></RoleGuard>} />
        <Route path="gastos" element={<RoleGuard roles={DINERO}><Gastos /></RoleGuard>} />
        <Route path="reportes" element={<RoleGuard roles={DINERO}><Reportes /></RoleGuard>} />

        <Route path="inventario" element={<RoleGuard roles={['super_admin', 'admin', 'auxiliar', 'asistente', 'tesorero']}><Inventario /></RoleGuard>} />
        <Route path="notas" element={<RoleGuard roles={DEPORTE}><Notas /></RoleGuard>} />

        <Route path="alertas" element={<RoleGuard roles={DINERO}><Alertas /></RoleGuard>} />
        <Route path="whatsapp" element={<RoleGuard roles={DINERO}><WhatsApp /></RoleGuard>} />
        <Route path="bitacora" element={<RoleGuard roles={['super_admin']}><Bitacora /></RoleGuard>} />
        <Route path="configuracion" element={<RoleGuard roles={['super_admin']}><Configuracion /></RoleGuard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
