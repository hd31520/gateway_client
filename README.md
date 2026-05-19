# MERN Payment Gateway Client

This is the React merchant/client dashboard for the payment gateway. It includes a popup-style demo checkout for merchant payments and does not show a public server URL field.

API requests use `VITE_PAYMENT_GATEWAY_API_URL` when it is set. If it is blank, the app calls the current origin, which is useful when the React client and API are deployed together.

```text
VITE_PAYMENT_GATEWAY_API_URL=https://payment-gateway-server-ten.vercel.app
```

During development the Vite dev server proxies `/api` to `VITE_PAYMENT_GATEWAY_API_URL`, which defaults to the live server.

## Demo checkout flow

The Payment Link form opens a GatewayFlow payment popup. Customers do not enter a payment reference. The popup collects the sender number used for bKash/Nagad and submits:

```json
{
  "domain": "example.com",
  "payer_number": "01711112222",
  "amount": 500,
  "order_id": "ORDER-1001",
  "payment_time": "2026-05-19T10:30:00.000Z"
}
```

The API verifies the payment when the merchant's logged-in Android app uploads a matching SMS record for the same sender number, exact amount, and payment time window.

## Setup

```bash
npm install
npm run dev
```

The client is configured to talk to the live server by default:

```text
https://payment-gateway-server-ten.vercel.app
```

Open the live client:

```text
https://gateway-client-rho.vercel.app
```

## Production Build

```bash
npm run build
npm start
```

`npm start` previews the built React app only. There is no local proxy layer in the client.

