import { useEffect, useRef } from 'react';
import { fetchNui } from '../utils/fetchNui';

const useKeyboardBridge = () => {
  const lastKeyRef = useRef({ key: '', time: 0 });

  useEffect(() => {
    // Helper to set native value correctly for both Input and Textarea
    const setNativeValue = (element, value) => {
      const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
      const prototype = Object.getPrototypeOf(element);
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

      if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
      } else {
        // Fallback for when React hasn't overridden the setter or it's a different element type
        const setter = Object.getOwnPropertyDescriptor(
          element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
          'value'
        ).set;
        setter.call(element, value);
      }
    };

    // Ascolta messaggi dal bridge.html (che cattura gli eventi tastiera)
    const handleMessage = (event) => {
      const message = event.data;

      // Gestione ESC per chiudere il terminale
      if (message.action === 'keypress' && message.data.key === 'Escape') {
        //console.log('[KeyBridge] ESC pressed - closing terminal');
        fetchNui('close');
        return;
      }

      // Gestione paste dal bridge
      if (message.action === 'paste') {
        const pastedText = message.data.text;

        // Previeni paste duplicati con debounce più aggressivo
        const now = Date.now();
        if (lastKeyRef.current.key === 'PASTE' && (now - lastKeyRef.current.time) < 100) {
          //console.log('[KeyBridge] ⚠️ Duplicate paste ignored');
          return;
        }
        lastKeyRef.current = { key: 'PASTE', time: now };

        //console.log('[KeyBridge] 📋 Paste received:', pastedText);

        const focusedElement = document.activeElement;
        if (focusedElement && (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA')) {
          const start = focusedElement.selectionStart;
          const end = focusedElement.selectionEnd;
          const currentValue = focusedElement.value;
          const newValue = currentValue.substring(0, start) + pastedText + currentValue.substring(end);

          setNativeValue(focusedElement, newValue);

          const inputEvent = new Event('input', { bubbles: true });
          focusedElement.dispatchEvent(inputEvent);

          // Posiziona il cursore dopo il testo incollato
          focusedElement.selectionStart = focusedElement.selectionEnd = start + pastedText.length;
          //console.log('[KeyBridge] ✅ Paste applied successfully');
        }
        return;
      }

      if (message.action === 'keypress') {
        const { key, code } = message.data;

        // Previeni duplicati SOLO per caratteri normali (non tasti modificatori o frecce)
        const isDebounceable = key.length === 1 || key === 'Backspace' || key === 'Delete' || key === 'Enter';

        if (isDebounceable) {
          const now = Date.now();
          if (lastKeyRef.current.key === key && (now - lastKeyRef.current.time) < 50) {
            //console.log('[KeyBridge] ⚠️ Duplicate key ignored:', key);
            return;
          }
          lastKeyRef.current = { key, time: now };
        }

        //console.log('[KeyBridge] Key received:', key, code);

        // Trova l'elemento con focus
        const focusedElement = document.activeElement;

        if (focusedElement && (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA')) {
          // Gestione combinazioni CTRL
          if (message.data.ctrlKey) {
            const lowerKey = key.toLowerCase();

            // CTRL + A - Seleziona tutto
            if (lowerKey === 'a') {
              focusedElement.select();
              //console.log('[KeyBridge] CTRL+A - Select all');
              return;
            }

            // CTRL + C - Copia (già gestito dal browser)
            if (lowerKey === 'c') {
              //console.log('[KeyBridge] CTRL+C - Copy');
              document.execCommand('copy');
              return;
            }

            // CTRL + V - Incolla (gestito dall'evento paste del bridge)
            if (lowerKey === 'v') {
              //console.log('[KeyBridge] CTRL+V - Waiting for paste event from bridge...');
              // Non fare nulla qui, il paste è gestito dall'evento 'paste' del bridge
              return;
            }

            // CTRL + X - Taglia
            if (lowerKey === 'x') {
              //console.log('[KeyBridge] CTRL+X - Cut');
              const start = focusedElement.selectionStart;
              const end = focusedElement.selectionEnd;
              const selectedText = focusedElement.value.substring(start, end);

              if (selectedText) {
                // Copia negli appunti
                navigator.clipboard.writeText(selectedText).then(() => {
                  // Rimuovi il testo selezionato
                  const currentValue = focusedElement.value;
                  const newValue = currentValue.substring(0, start) + currentValue.substring(end);

                  setNativeValue(focusedElement, newValue);

                  const inputEvent = new Event('input', { bubbles: true });
                  focusedElement.dispatchEvent(inputEvent);

                  focusedElement.selectionStart = focusedElement.selectionEnd = start;
                });
              }
              return;
            }

            // CTRL + Z - Undo (non facilmente implementabile in React)
            if (lowerKey === 'z') {
              //console.log('[KeyBridge] CTRL+Z - Undo (not supported)');
              return;
            }

            // Ignora altre combinazioni CTRL
            //console.log('[KeyBridge] CTRL+' + key + ' ignored');
            return;
          }

          // Gestione Backspace
          if (key === 'Backspace') {
            if (focusedElement.value.length > 0) {
              const newValue = focusedElement.value.slice(0, -1);

              setNativeValue(focusedElement, newValue);

              // Trigger eventi React
              const inputEvent = new Event('input', { bubbles: true });
              focusedElement.dispatchEvent(inputEvent);
            }
            return;
          }

          // Gestione Enter
          if (key === 'Enter') {
            // Se è una textarea, inserisci newline invece di submit
            if (focusedElement.tagName === 'TEXTAREA') {
              const start = focusedElement.selectionStart;
              const end = focusedElement.selectionEnd;
              const currentValue = focusedElement.value;
              const newValue = currentValue.substring(0, start) + '\n' + currentValue.substring(end);

              setNativeValue(focusedElement, newValue);

              const inputEvent = new Event('input', { bubbles: true });
              focusedElement.dispatchEvent(inputEvent);

              focusedElement.selectionStart = focusedElement.selectionEnd = start + 1;
              return;
            }

            const form = focusedElement.closest('form');
            if (form) {
              form.requestSubmit();
            }
            return;
          }

          // Gestione Tab (per navigare tra campi)
          if (key === 'Tab') {
            const inputs = Array.from(document.querySelectorAll('input, textarea, button'));
            const currentIndex = inputs.indexOf(focusedElement);
            const nextIndex = message.data.shiftKey ? currentIndex - 1 : currentIndex + 1;
            const nextElement = inputs[nextIndex] || inputs[0];
            if (nextElement) nextElement.focus();
            return;
          }

          // Gestione frecce direzionali
          if (key === 'ArrowLeft') {
            if (focusedElement.selectionStart > 0) {
              focusedElement.selectionStart = focusedElement.selectionEnd = focusedElement.selectionStart - 1;
            }
            return;
          }

          if (key === 'ArrowRight') {
            if (focusedElement.selectionStart < focusedElement.value.length) {
              focusedElement.selectionStart = focusedElement.selectionEnd = focusedElement.selectionStart + 1;
            }
            return;
          }

          if (key === 'Home') {
            focusedElement.selectionStart = focusedElement.selectionEnd = 0;
            return;
          }

          if (key === 'End') {
            const len = focusedElement.value.length;
            focusedElement.selectionStart = focusedElement.selectionEnd = len;
            return;
          }

          // Gestione Delete
          if (key === 'Delete') {
            const start = focusedElement.selectionStart;
            const end = focusedElement.selectionEnd;
            const currentValue = focusedElement.value;

            let newValue;
            if (start === end && start < currentValue.length) {
              // Nessuna selezione: cancella il carattere dopo il cursore
              newValue = currentValue.substring(0, start) + currentValue.substring(start + 1);
            } else if (start !== end) {
              // C'è una selezione: cancella la selezione
              newValue = currentValue.substring(0, start) + currentValue.substring(end);
            } else {
              return; // Cursore alla fine, niente da cancellare
            }

            setNativeValue(focusedElement, newValue);

            const inputEvent = new Event('input', { bubbles: true });
            focusedElement.dispatchEvent(inputEvent);

            focusedElement.selectionStart = focusedElement.selectionEnd = start;
            return;
          }

          // Gestione caratteri normali (ignora tasti modificatori)
          if (key.length === 1 && !message.data.ctrlKey && !message.data.altKey) {
            const newValue = focusedElement.value + key;

            setNativeValue(focusedElement, newValue);

            // Trigger eventi React
            const inputEvent = new Event('input', { bubbles: true });
            focusedElement.dispatchEvent(inputEvent);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    //console.log('[KeyBridge] Message listener attached');

    return () => {
      window.removeEventListener('message', handleMessage);
      //console.log('[KeyBridge] Message listener removed');
    };
  }, []);
};

export default useKeyboardBridge;
