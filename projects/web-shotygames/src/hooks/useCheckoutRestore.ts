import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useCheckoutRestore = () => {
  const [shouldOpenCheckout, setShouldOpenCheckout] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const shouldRestore = localStorage.getItem('restoreCheckout');
    const checkoutContextString = localStorage.getItem('checkoutContext');
    
    if (shouldRestore === 'true' && checkoutContextString) {
      const context = JSON.parse(checkoutContextString);
      
      // Only restore if we're on the same page that initiated the checkout
      if (context.originPath === location.pathname) {
        setShouldOpenCheckout(true);
      }
    }
  }, [location.pathname]);

  return { shouldOpenCheckout, setShouldOpenCheckout };
};
