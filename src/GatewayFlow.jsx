import React, { useState, useEffect } from 'react';
import PaymentGateway from './PaymentGateway';

/**
 * GatewayFlow Component
 * Wrapper component to integrate PaymentGateway popup with the main app
 * Usage: <GatewayFlow isOpen={true} onClose={handleClose} />
 */
export default function GatewayFlow({ isOpen = false, onClose, initialData = {} }) {
  const [paymentState, setPaymentState] = useState({
    isOpen,
    status: null,
    paymentId: null,
    amount: null,
  });

  useEffect(() => {
    setPaymentState((prev) => ({ ...prev, isOpen }));
  }, [isOpen]);

  const handleClose = () => {
    setPaymentState((prev) => ({
      ...prev,
      isOpen: false,
      status: null,
      paymentId: null,
    }));
    if (onClose) onClose();
  };

  if (!paymentState.isOpen) {
    return null;
  }

  return (
    <>
      <PaymentGateway />
      {/* The PaymentGateway component handles its own modal rendering */}
    </>
  );
}

/**
 * Export a hook for easy integration
 */
export function usePaymentGateway() {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState(null);

  return {
    isOpen,
    result,
    openPaymentGateway: () => setIsOpen(true),
    closePaymentGateway: () => setIsOpen(false),
    resetResult: () => setResult(null),
    component: (
      <GatewayFlow
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    ),
  };
}
