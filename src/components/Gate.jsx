import { useAuth } from '../context/AuthContext.jsx';

/**
 * <Gate module="clients" action="supprimer">
 *   <button>Supprimer</button>
 * </Gate>
 *
 * Props:
 *   module, action   — permission to check
 *   fallback         — what to render if access denied (default: null)
 *   readOnly         — if true, renders children with readOnly instead of hiding
 */
export default function Gate({ module, action, children, fallback = null, readOnly = false }) {
  const { can } = useAuth();

  if (can(module, action)) return children;

  if (readOnly) {
    // Wrap children in a disabled/read-only container
    return (
      <div
        className="pointer-events-none opacity-50 select-none"
        title="Vous n'avez pas la permission de modifier ce champ"
      >
        {children}
      </div>
    );
  }

  return fallback;
}

/**
 * <AccessDenied /> — full-page or inline message for blocked routes
 */
export function AccessDenied({ message = "Vous n'avez pas accès à cette section." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-brick-50 flex items-center justify-center text-2xl">🔒</div>
      <div className="text-lg font-semibold text-ink">Accès refusé</div>
      <p className="text-sm text-muted max-w-xs">{message}</p>
    </div>
  );
}
