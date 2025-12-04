import { useEffect } from 'react';

const useNuiEvent = (action, handler) => {
  useEffect(() => {
    const eventListener = (event) => {
      const { action: eventAction, data } = event.data;

      if (eventAction === action) {
        handler(data);
      }
    };

    window.addEventListener('message', eventListener);

    return () => window.removeEventListener('message', eventListener);
  }, [action, handler]);
};

export default useNuiEvent;
