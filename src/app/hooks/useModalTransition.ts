import { useEffect, useState } from 'react';

/**
 * Returns `mounted` (whether to render), `backdropClass`, and `panelClass`
 * to drive enter/exit CSS animations on modals.
 */
export function useModalTransition(isOpen: boolean, exitDuration = 220) {
  const [mounted, setMounted] = useState(isOpen);
  const [animating, setAnimating] = useState<'enter' | 'exit' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // next tick so the DOM paints the exit class first
      requestAnimationFrame(() => setAnimating('enter'));
    } else {
      setAnimating('exit');
      const t = setTimeout(() => {
        setMounted(false);
        setAnimating(null);
      }, exitDuration);
      return () => clearTimeout(t);
    }
  }, [isOpen, exitDuration]);

  const isEnter = animating === 'enter' || (mounted && animating === null && isOpen);

  return {
    mounted,
    backdropClass: isEnter ? 'modal-backdrop-enter' : 'modal-backdrop-exit',
    panelClass:    isEnter ? 'modal-panel-enter'    : 'modal-panel-exit',
    chatClass:     isEnter ? 'chat-panel-enter'     : 'chat-panel-exit',
  };
}
