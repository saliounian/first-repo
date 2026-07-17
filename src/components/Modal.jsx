import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal partagé — reste toujours visible, clavier ouvert ou non, mobile & desktop.
 *
 * Problème résolu : un overlay `fixed inset-0` occupe le *layout viewport* (hauteur
 * totale, inchangée par le clavier). Un contenu centré s'y centre donc dans la hauteur
 * complète → sa moitié basse passe sous le clavier. Ici on cale l'overlay sur le
 * *visualViewport* (zone réellement visible au-dessus du clavier) et on le rend
 * scrollable, donc tout champ reste atteignable.
 *
 * Props :
 *  - onClose            : callback fermeture (bouton croix / Annuler gardés dans le contenu)
 *  - closeOnBackdrop    : ferme au clic sur le fond (défaut false — évite pertes de saisie)
 *  - align              : 'center' (défaut) | 'top'
 *  - z                  : classe z-index tailwind (défaut 'z-50')
 *  - backdrop           : classe fond (défaut 'bg-black/40')
 */
export default function Modal({
  children,
  onClose,
  closeOnBackdrop = false,
  align = 'center',
  z = 'z-50',
  backdrop = 'bg-black/40',
  className = '',
}) {
  const overlayRef = useRef(null);

  // Cale l'overlay sur le visualViewport (gère l'ouverture du clavier)
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const el = overlayRef.current;
    if (!vv || !el) return;
    const apply = () => {
      el.style.height = `${vv.height}px`;
      el.style.transform = `translateY(${vv.offsetTop}px)`;
    };
    apply();
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
    return () => {
      vv.removeEventListener('resize', apply);
      vv.removeEventListener('scroll', apply);
    };
  }, []);

  // Verrouille le scroll du body pendant l'ouverture
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Échap ferme
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const justify = align === 'top' ? 'justify-start' : 'justify-start sm:justify-center';

  return createPortal(
    <div
      ref={overlayRef}
      className={`fixed inset-x-0 top-0 ${z} ${backdrop} overflow-y-auto overscroll-contain flex flex-col items-center ${justify} px-4 py-4 ${className}`}
      style={{ height: '100dvh' }}
      onClick={closeOnBackdrop && onClose ? onClose : undefined}
    >
      <div className="w-full flex justify-center my-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
