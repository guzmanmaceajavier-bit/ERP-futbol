import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isDemoMode } from '../../services/demoStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Icon } from '../../components/ui/Icon';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();
    if (!trimmedUser || !trimmedPass) {
      setError('Complete todos los campos');
      return;
    }
    setLoading(true);
    try {
      await login(trimmedUser, trimmedPass);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}
        <Input
          label="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          autoComplete="username"
          required
        />
        <div className="relative">
          <Input
            label="Contrasena"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="admin123"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-slate-400 hover:text-white transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <Icon name="ocultar" className="w-5 h-5" />
            ) : (
              <Icon name="ver" className="w-5 h-5" />
            )}
          </button>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Iniciar sesion
        </Button>
      </form>

      {isDemoMode() && (
        <div className="mt-6 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            Usuario de prueba: <span className="text-slate-400">admin</span> / <span className="text-slate-400">admin123</span>
          </p>
        </div>
      )}
    </div>
  );
}
