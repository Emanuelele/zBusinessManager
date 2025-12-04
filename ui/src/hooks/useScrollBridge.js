import { useEffect, useRef } from 'react';
import { fetchNui } from '../utils/fetchNui';

const useScrollBridge = () => {
  const cursorRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // 1. Listener per inviare scroll al client (NUI Overlay -> Lua)
    const handleWheel = (e) => {
      fetchNui('bridgeScroll', {
        deltaX: e.deltaX,
        deltaY: e.deltaY,
      });
    };

    window.addEventListener('wheel', handleWheel);

    // 2. Listener per ricevere scroll dal client (Lua -> DUI)
    const handleMessage = (event) => {
      const message = event.data;

      // Aggiorna posizione cursore
      if (message.action === 'cursorMove') {
        cursorRef.current = { x: message.data.x, y: message.data.y };
        return;
      }

      if (message.action === 'scroll') {
        const { deltaY } = message.data;
        const { x, y } = cursorRef.current;

        // Trova elemento sotto il cursore
        const element = document.elementFromPoint(x, y);

        if (element) {
          // Trova il primo genitore scrollabile
          let target = element;
          while (target && target !== document.body) {
            const style = window.getComputedStyle(target);
            const overflowY = style.overflowY;
            const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight;

            if (isScrollable) {
              target.scrollTop += deltaY;
              // //console.log('[ScrollBridge] Scrolled:', target.className);
              return;
            }
            target = target.parentElement;
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('message', handleMessage);
    };
  }, []);
};

export default useScrollBridge;
