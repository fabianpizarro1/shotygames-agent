import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Red de seguridad para cuando lazyWithRetry ya intentó el reload automático
 * y la página igual no cargó (ej. el usuario está realmente sin internet).
 * Sin esto, un error en cualquier ruta lazy tumba toda la app en blanco.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm">
            <p className="text-lg font-semibold">No se pudo cargar la página</p>
            <p className="text-sm text-muted-foreground">
              Puede ser tu conexión. Tu pedido, si lo hiciste, ya quedó registrado.
            </p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
