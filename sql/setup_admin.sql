-- Generar hash para contraseña admin123 y actualizar
-- Ejecutar en la consola SQL de Neon:
-- UPDATE usuarios SET password = '$2a$10$YOUR_HASH_HERE' WHERE username = 'admin';
-- 
-- O crear usuario manualmente desde Node:
-- node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('admin123',10).then(h=>console.log(h))"

-- Si no existe la tabla usuarios, crearla:
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(200),
  role VARCHAR(50) DEFAULT 'admin',
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
