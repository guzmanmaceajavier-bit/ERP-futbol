import { AuthProvider } from '../context/AuthContext';

/**
 * Agrupa los providers globales de la aplicacion.
 * Agregar aqui nuevos providers (Toast, Tema, Query) en vez de anidarlos en App.tsx.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
