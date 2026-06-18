const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'main.jsx');
let source = fs.readFileSync(filePath, 'utf8');

function replaceOnce(oldText, newText, label) {
  if (!source.includes(oldText)) {
    if (source.includes(newText)) {
      console.log(`[hotfix] ${label} already applied`);
      return;
    }
    throw new Error(`[hotfix] Missing target: ${label}`);
  }
  source = source.replace(oldText, newText);
  console.log(`[hotfix] Applied: ${label}`);
}

replaceOnce(
  "import React, { useEffect, useMemo, useState } from 'react';",
  "import React, { useEffect, useMemo, useRef, useState } from 'react';",
  'add useRef import'
);

replaceOnce(
  "function OverviewContent({ client, websites, stats, portalData, websiteMessage, checkoutMessage, response, onAddWebsite, onRenewWebsite, onVerifyPayment, onPollPaymentStatus }) {",
  "function OverviewContent({ client, websites, stats, portalData, websiteMessage, checkoutMessage, response, onAddWebsite, onRenewWebsite, onEditWebsite, onVerifyPayment, onPollPaymentStatus }) {",
  'wire onEditWebsite into OverviewContent'
);

replaceOnce(
  "  const [submitting, setSubmitting] = useState(false);\n  useEffect(() => { if (!form.websiteId && websites[0]?.id) setForm((current) => ({ ...current, websiteId: websites[0].id })); }, [websites, form.websiteId]);",
  "  const [submitting, setSubmitting] = useState(false);\n  const popupRunRef = useRef(0);\n  useEffect(() => { if (!form.websiteId && websites[0]?.id) setForm((current) => ({ ...current, websiteId: websites[0].id })); }, [websites, form.websiteId]);",
  'add popup run guard ref'
);

replaceOnce(
  `  useEffect(() => {
    if (!popupOpen || popupStep !== 'waiting') return undefined;
    setCountdown(120);
    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setPopupStep('failed');
          setPopupMessage('Payment failed. No matching Android SMS arrived within 2 minutes.');
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [popupOpen, popupStep]);`,
  `  useEffect(() => {
    if (!popupOpen || popupStep !== 'waiting') return undefined;

    const runId = popupRunRef.current;
    setCountdown(120);

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (popupRunRef.current !== runId) {
          window.clearInterval(timer);
          return current;
        }

        if (current <= 1) {
          window.clearInterval(timer);
          popupRunRef.current += 1;
          setPopupStep('failed');
          setPopupMessage('Payment failed. No matching Android SMS arrived within 2 minutes.');
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [popupOpen, popupStep]);`,
  'guard popup countdown against stale async requests'
);

replaceOnce(
  `  async function waitForServerConfirmation(requestId) {
    if (!requestId || !onPollStatus) return null;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
      const data = await onPollStatus({ websiteId: form.websiteId, requestId });
      const status = String(data?.status || '').toLowerCase();
      if (['verified', 'manual_accepted', 'already_verified'].includes(status)) return data;
      if (['failed', 'rejected', 'expired'].includes(status)) return { success: false, error: data?.message || data?.error || 'Payment failed.', ...data };
    }
    return { success: false, error: 'Payment failed. No matching Android SMS arrived within 2 minutes.' };
  }`,
  `  async function waitForServerConfirmation(requestId, runId) {
    if (!requestId || !onPollStatus) return null;

    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (popupRunRef.current !== runId) return null;

      await new Promise((resolve) => window.setTimeout(resolve, 2000));

      if (popupRunRef.current !== runId) return null;

      const data = await onPollStatus({ websiteId: form.websiteId, requestId });
      const status = String(data?.status || '').toLowerCase();
      if (['verified', 'manual_accepted', 'already_verified'].includes(status)) return data;
      if (['failed', 'rejected', 'expired'].includes(status)) return { success: false, error: data?.message || data?.error || 'Payment failed.', ...data };
    }

    return { success: false, error: 'Payment failed. No matching Android SMS arrived within 2 minutes.' };
  }`,
  'ignore stale popup polling results'
);

replaceOnce(
  `  function openPopup() {
    setPopupStep('methods');
    setPopupMessage('');
    setSubmitting(false);
    setPopupOpen(true);
  }`,
  `  function openPopup() {
    popupRunRef.current += 1;
    setPopupStep('methods');
    setPopupMessage('');
    setSubmitting(false);
    setPopupOpen(true);
  }`,
  'reset popup run id on open'
);

replaceOnce(
  `  async function submitPopup() {
    setSubmitting(true);
    setPopupStep('waiting');
    setPopupMessage('Android SMS listener is waiting for sender number, amount, and receive time match.');
    const result = await onSubmit({ ...form, payerNumber: cleanPayerNumber, paymentTime: new Date().toISOString(), walletProvider: selectedWallet?.provider || selectedWallet?.id, receiverNumber: selectedWallet?.number || '' });
    setSubmitting(false);
    if (!result?.success) {
      setPopupStep('failed');
      setPopupMessage(result?.error || result?.message || 'Payment verification failed.');
      return;
    }
    const status = String(result.status || '').toLowerCase();
    if (['verified', 'manual_accepted', 'already_verified'].includes(status)) {
      setPopupStep('success');
      setPopupMessage(paymentVerificationMessage(result));
    } else {
      setPopupMessage(result.message || 'Waiting for Android SMS confirmation. This popup will fail after 2 minutes without a matching SMS.');
      const requestId = result.pendingVerification?.id || result.requestId;
      const finalResult = await waitForServerConfirmation(requestId);
      if (!finalResult || popupStep === 'failed') return;
      if (finalResult.success && ['verified', 'manual_accepted', 'already_verified'].includes(String(finalResult.status || '').toLowerCase())) {
        setPopupStep('success');
        setPopupMessage(paymentVerificationMessage(finalResult));
      } else {
        setPopupStep('failed');
        setPopupMessage(finalResult.error || finalResult.message || 'Payment failed.');
      }
    }
  }`,
  `  async function submitPopup() {
    const runId = popupRunRef.current + 1;
    popupRunRef.current = runId;

    setSubmitting(true);
    setPopupStep('waiting');
    setPopupMessage('Android SMS listener is waiting for sender number, amount, and receive time match.');

    try {
      const result = await onSubmit({
        ...form,
        payerNumber: cleanPayerNumber,
        paymentTime: new Date().toISOString(),
        walletProvider: selectedWallet?.provider || selectedWallet?.id,
        receiverNumber: selectedWallet?.number || ''
      });

      if (popupRunRef.current !== runId) return;

      if (!result?.success) {
        setPopupStep('failed');
        setPopupMessage(result?.error || result?.message || 'Payment verification failed.');
        return;
      }

      const status = String(result.status || '').toLowerCase();
      if (['verified', 'manual_accepted', 'already_verified'].includes(status)) {
        setPopupStep('success');
        setPopupMessage(paymentVerificationMessage(result));
        return;
      }

      setPopupMessage(result.message || 'Waiting for Android SMS confirmation. This popup will fail after 2 minutes without a matching SMS.');
      const requestId = result.pendingVerification?.id || result.requestId;
      const finalResult = await waitForServerConfirmation(requestId, runId);

      if (popupRunRef.current !== runId || !finalResult) return;

      if (finalResult.success && ['verified', 'manual_accepted', 'already_verified'].includes(String(finalResult.status || '').toLowerCase())) {
        setPopupStep('success');
        setPopupMessage(paymentVerificationMessage(finalResult));
      } else {
        setPopupStep('failed');
        setPopupMessage(finalResult.error || finalResult.message || 'Payment failed.');
      }
    } catch (error) {
      if (popupRunRef.current === runId) {
        setPopupStep('failed');
        setPopupMessage(error?.message || 'Payment verification failed.');
      }
    } finally {
      if (popupRunRef.current === runId) {
        setSubmitting(false);
      }
    }
  }`,
  'make popup submit race-safe'
);

fs.writeFileSync(filePath, source, 'utf8');
console.log('[hotfix] Client build hotfix completed');
