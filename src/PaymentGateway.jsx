import React, { useState, useEffect } from 'react';
import './PaymentGateway.css';

export default function PaymentGateway() {
  const [step, setStep] = useState('method'); // 'method' | 'payment' | 'confirm'
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [receiverNumber, setReceiverNumber] = useState('');
  const [status, setStatus] = useState(null); // 'pending' | 'success' | 'failed'
  const [timeLeft, setTimeLeft] = useState(120);
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState(null);

  const paymentMethods = [
    { id: 'bkash', name: 'bKash', icon: '📱' },
    { id: 'nagad', name: 'Nagad', icon: '📲' },
    { id: 'rocket', name: 'Rocket', icon: '🚀' },
  ];

  // Timer for 2-minute timeout
  useEffect(() => {
    if (status === 'pending' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'pending' && timeLeft === 0) {
      setStatus('failed');
    }
  }, [status, timeLeft]);

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setStep('payment');
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!phoneNumber || !amount) {
      alert('Please enter phone and amount');
      return;
    }
    // Generate receiver number (mock)
    const receiver = generateReceiverNumber(selectedMethod.id);
    setReceiverNumber(receiver);
    setStep('confirm');
  };

  const generateReceiverNumber = (method) => {
    const numbers = {
      bkash: '01722123456',
      nagad: '01911223344',
      rocket: '01733445566',
    };
    return numbers[method];
  };

  const handleTriggerPayment = async () => {
    if (loading) return;
    setLoading(true);
    setStatus('pending');
    setTimeLeft(120);

    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: selectedMethod.id,
          senderPhone: phoneNumber,
          receiverPhone: receiverNumber,
          amount: parseFloat(amount),
        }),
      });

      if (!response.ok) throw new Error('Failed to initiate payment');
      // Get paymentId from server and start polling for status
      const result = await response.json();
      console.log('Payment initiated:', result);
      if (result && result.paymentId) {
        setPaymentId(result.paymentId);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setStatus('failed');
      setLoading(false);
    }
  };

  // Poll server for payment status while pending
  useEffect(() => {
    if (status !== 'pending' || !paymentId) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/gateway/status/${paymentId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        if (data.status === 'verified') {
          setStatus('success');
          setLoading(false);
        } else if (data.status === 'expired' || data.status === 'cancelled') {
          setStatus('failed');
          setLoading(false);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status, paymentId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(receiverNumber);
    alert('Copied to clipboard!');
  };

  return (
    <div className="payment-gateway-modal">
      {step === 'method' && (
        <div className="gateway-step">
          <h2>Select Payment Method</h2>
          <div className="methods-grid">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                className="method-card"
                onClick={() => handleMethodSelect(method)}
              >
                <span className="method-icon">{method.icon}</span>
                <span className="method-name">{method.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="gateway-step">
          <h2>Send Money from {selectedMethod.name}</h2>
          <form onSubmit={handlePhoneSubmit}>
            <div className="form-group">
              <label>Your Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                required
              />
            </div>
            <div className="form-group">
              <label>Amount (Taka)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                required
              />
            </div>
            <button type="submit" className="btn-next">Next</button>
            <button
              type="button"
              className="btn-back"
              onClick={() => setStep('method')}
            >
              Back
            </button>
          </form>
        </div>
      )}

      {step === 'confirm' && (
        <div className="gateway-step">
          {status === null && (
            <>
              <h2>Send ৳{amount} to {receiverNumber}</h2>
              <div className="receiver-info">
                <p>Send exactly <strong>৳{amount}</strong> to:</p>
                <div className="receiver-number">
                  <span>{receiverNumber}</span>
                  <button className="btn-copy" onClick={copyToClipboard}>
                    📋 Copy
                  </button>
                </div>
              </div>
              <div className="tutorial">
                <details>
                  <summary>📖 How to send money with {selectedMethod.name}?</summary>
                  <div className="tutorial-content">
                    <ol>
                      <li>Open {selectedMethod.name} app</li>
                      <li>Select "Send Money"</li>
                      <li>Enter <strong>{receiverNumber}</strong></li>
                      <li>Enter amount <strong>৳{amount}</strong></li>
                      <li>Confirm and complete</li>
                    </ol>
                  </div>
                </details>
              </div>
              <button
                className="btn-trigger"
                onClick={handleTriggerPayment}
                disabled={loading}
              >
                {loading ? 'Waiting...' : '✓ I Sent the Money'}
              </button>
              <button
                className="btn-back"
                onClick={() => setStep('payment')}
              >
                Back
              </button>
            </>
          )}

          {status === 'pending' && (
            <div className="status-container pending">
              <div className="spinner"></div>
              <h3>Verifying Payment...</h3>
              <p>Time left: {timeLeft}s</p>
              <p className="small-text">We're waiting for SMS confirmation</p>
            </div>
          )}

          {status === 'success' && (
            <div className="status-container success">
              <div className="checkmark">✓</div>
              <h3>Payment Successful!</h3>
              <p>Your payment of ৳{amount} has been verified.</p>
              <button
                className="btn-close"
                onClick={() => window.location.reload()}
              >
                Done
              </button>
            </div>
          )}

          {status === 'failed' && (
            <div className="status-container failed">
              <div className="cross">✗</div>
              <h3>Payment Failed</h3>
              <p>SMS verification timeout or not received.</p>
              <button
                className="btn-retry"
                onClick={() => {
                  setStatus(null);
                  setStep('payment');
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
