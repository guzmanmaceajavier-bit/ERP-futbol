import { Component, type ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <Icon name="alerta" className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Algo salio mal</h3>
          <p className="text-slate-400 mb-4 max-w-md text-sm">
            {this.state.error?.message || 'Error inesperado en la pagina.'}
          </p>
          <Button onClick={() => this.setState({ hasError: false, error: null })}>Reintentar</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
