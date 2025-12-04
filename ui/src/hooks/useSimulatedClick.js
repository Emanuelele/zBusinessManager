import { useEffect, useRef } from 'react';

const useSimulatedClick = () => {
  const lastClickRef = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    const handleClickEvent = (event) => {
      const message = event.data;

      if (message.action === 'click') {
        const { x, y } = message.data;

        // Debounce: ignora click identici entro 150ms
        const now = Date.now();
        const last = lastClickRef.current;
        if (last.x === x && last.y === y && (now - last.time) < 150) {
          //console.log('[SimClick] Debounced duplicate click');
          return;
        }
        lastClickRef.current = { x, y, time: now };

        // Trova l'elemento alle coordinate specificate
        const element = document.elementFromPoint(x, y);

        //console.log('[SimClick] Click at', x, y, 'element:', element?.tagName, element?.className);

        if (element) {
          // Trova il button più vicino (potrebbe essere un parent)
          let targetElement = element;
          if (element.tagName !== 'BUTTON') {
            const closestButton = element.closest('button');
            if (closestButton) {
              //console.log('[SimClick] Found parent button');
              targetElement = closestButton;
            }
          }

          const tagName = targetElement.tagName;

          // STRATEGIA 1: INPUT/TEXTAREA - Usa sequenza eventi completa
          if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
            //console.log('[SimClick] Input/Textarea - using event sequence');

            const mousedownEvent = new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window,
              button: 0,
              clientX: x,
              clientY: y
            });

            const mouseupEvent = new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              view: window,
              button: 0,
              clientX: x,
              clientY: y
            });

            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
              button: 0,
              clientX: x,
              clientY: y
            });

            targetElement.dispatchEvent(mousedownEvent);
            targetElement.dispatchEvent(mouseupEvent);
            targetElement.dispatchEvent(clickEvent);
            targetElement.focus();
            return;
          }

          // STRATEGIA 2: BUTTON React - Cerca e chiama onClick dalle props
          if (tagName === 'BUTTON') {
            // Se è un submit button dentro un form, trigghera il submit
            const form = targetElement.closest('form');
            if (targetElement.type === 'submit' && form) {
              //console.log('[SimClick] Submit button - triggering form submit');
              form.requestSubmit(targetElement);
              return;
            }

            const reactPropsKey = Object.keys(targetElement).find(key =>
              key.startsWith('__reactProps') ||
              key.startsWith('__reactEventHandlers') ||
              key.startsWith('__reactInternalInstance')
            );

            if (reactPropsKey) {
              const props = targetElement[reactPropsKey];
              const onClick = props?.onClick || props?.memoizedProps?.onClick;

              if (onClick && typeof onClick === 'function') {
                //console.log('[SimClick] Button - calling React onClick directly');
                try {
                  onClick({
                    preventDefault: () => { },
                    stopPropagation: () => { },
                    target: targetElement,
                    currentTarget: targetElement,
                    button: 0,
                    clientX: x,
                    clientY: y,
                    type: 'click',
                    nativeEvent: { button: 0 }
                  });
                  return;
                } catch (error) {
                  //console.error('[SimClick] Error calling React onClick:', error);
                }
              }
            }

            // Fallback per button senza React props
            //console.log('[SimClick] Button - using native click()');
            targetElement.click();
            return;
          }

          // STRATEGIA 3: Altri elementi - native click
          //console.log('[SimClick] Other element - using native click()');
          targetElement.click();
        }
      }
    };

    window.addEventListener('message', handleClickEvent);
    return () => window.removeEventListener('message', handleClickEvent);
  }, []);
};

export default useSimulatedClick;
