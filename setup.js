import bcrypt from 'bcryptjs';
import pg from 'pg';
const { Pool } = pg;

async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('❌ Define DATABASE_URL en el entorno primero.');
    console.log('   Ej: $env:DATABASE_URL="postgres://..." en PowerShell');
    console.log('   O crear un archivo .env con DATABASE_URL=...');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    console.log('🔌 Conectando a la base de datos...');
    await pool.query('SELECT 1');
    console.log('✅ Conexión exitosa');
    
    console.log('\n📦 Ejecutando migraciones...');
    const fs = await import('fs');
    const sql1 = fs.readFileSync(new URL('./sql/migracion_001.sql', import.meta.url), 'utf-8');
    await pool.query(sql1);
    console.log('✅ Migración 001 OK');
    try {
      const sql2 = fs.readFileSync(new URL('./sql/migracion_002_v7.sql', import.meta.url), 'utf-8');
      await pool.query(sql2);
      console.log('✅ Migración 002 V7 OK');
    } catch(e){ console.log('⚠️  Migración V7:', e.message); }

    console.log('\n🔑 Creando usuarios...');
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO usuarios (username, password, nombre, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO UPDATE SET password = $2, role='super_admin'`,
      ['admin', hash, 'Administrador', 'super_admin']
    );
    console.log('✅ Usuario admin (super_admin / admin123)');
    const hashProfe = await bcrypt.hash('profe123', 10);
    await pool.query(`INSERT INTO usuarios (username, password, nombre, role) VALUES ($1,$2,$3,$4) ON CONFLICT (username) DO NOTHING`, ['profe', hashProfe, 'Profesor', 'profe']);
    console.log('✅ Usuario profe (profe / profe123)');

    console.log('\n🎉 Setup completado exitosamente!');
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

setup();
