/** Configuracion central de la aplicacion. En produccion puede leerse de import.meta.env. */

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const appConfig = {
  name: env.VITE_APP_NAME || 'ERP Futbol',
  shortName: 'EFUSA',
  version: env.VITE_APP_VERSION || '1.0.0',

  /** URL base de la API. Vacia = modo demo (localStorage). */
  apiUrl: env.VITE_API_URL || '',

  /** Fuerza el modo demo aunque exista apiUrl. */
  demoMode: env.VITE_DEMO_MODE !== 'false',

  /** Claves de localStorage usadas por el modo demo. */
  storageKeys: {
    mode: 'erp_demo_mode',
    data: 'erp_demo_data',
    version: 'erp_demo_version',
    token: 'erp_token',
    user: 'erp_user',
  },

  /** Version del esquema de datos demo. Cambiarla resetea los datos locales. */
  dataVersion: 'v7-sin-datos-demo',

  /** Credenciales del modo demo. */
  demoUser: { username: 'admin', password: 'admin123' },

  /** Reglas financieras por defecto. */
  finanzas: {
    diaVencimiento: 10,
    moneda: 'COP',
    idioma: 'es-CO',
  },
} as const;

export type AppConfig = typeof appConfig;
