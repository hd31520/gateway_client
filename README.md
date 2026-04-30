# MERN Payment Gateway Client

This is the React merchant/client dashboard for the payment gateway. It does not show a public server URL field.

API requests use `VITE_PAYMENT_GATEWAY_API_URL` when it is set. If it is blank, the app calls the current origin, which is useful when the React client and API are deployed together.

```text
VITE_PAYMENT_GATEWAY_API_URL=https://payment-gateway-server-ten.vercel.app
```

During development the Vite dev server proxies `/api` to `VITE_PAYMENT_GATEWAY_API_URL`, which defaults to the live server.

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

