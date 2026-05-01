
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const TOKEN_KEY = 'gatewayClientToken';
const ADMIN_TOKEN_KEY = 'gatewayAdminToken';
const FALLBACK_GATEWAY_API_URL = 'https://payment-gateway-server-ten.vercel.app';
const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_PAYMENT_GATEWAY_API_URL);

const featureCards = [
  ['Secure Transactions', 'Token based APIs, encrypted wallet credentials, and controlled verification keep payment data protected.'],
  ['Real-time Notifications', 'Payment status updates are ready for dashboards, checkout pages, and merchant workflows.'],
  ['Seamless Integration', 'Connect WordPress, WHMCS, Laravel, SMM panels, React apps, or custom websites through API keys.'],
  ['24/7 Monitoring', 'Android SMS forwarding and server verification keep transaction processing always visible.']
];

const guideSteps = [
  ['01', 'Create an Account and Buy a Plan', 'Open your client portal, add your website, and choose the access window that fits your business.'],
  ['02', 'Add Brand and Wallet Credentials', 'Install the Android app, log in, add bKash or Nagad sender rules, and connect your website API key.'],
  ['03', 'Enjoy Payment Automation', 'Customers pay, SMS is forwarded, and your merchant checkout verifies transaction ID plus amount.']
];

const pricingPlans = [
  ['1 Site', '1 Month', 'Tk 30', '1 Website'],
  ['Free Plan', '3 Days', 'Tk 0', '1 Website'],
  ['Basic 15', '15 Days', 'Tk 25', '1 Website'],
  ['30 Days', '1 Month', 'Tk 50', '5 Websites'],
  ['Business 30', '1 Month', 'Tk 100', '10 Websites'],
  ['Basic 365', '1 Year', 'Tk 500', '5 Websites'],
  ['Standard 365', '1 Year', 'Tk 1000', '10 Websites'],
  ['Ultimate 365', '1 Year', 'Tk 3000', 'Unlimited Websites']
];

const documentationSteps = [
  ['01', 'Account Login', 'Client portal থেকে account login বা registration করুন। Login থাকলে main page এবং dashboard দুই জায়গাতেই logout দেখা যাবে.'],
  ['02', 'Brand Payment', 'Opening charge admin bKash/Nagad এ পাঠিয়ে brand form-এ TrxID দিন.'],
  ['03', 'Auto Approval', 'Admin mobile SMS history-তে TrxID এবং amount মিললে brand instant active হবে.'],
  ['04', 'Android App', 'Brand active হলে Android app download করুন, client account দিয়ে login করুন, এবং SMS permission allow করুন.'],
  ['05', 'SMS Sender', 'bKash, Nagad, Rocket বা দরকারি sender rule add করুন। চাইলে contact থেকেও sender pick করা যাবে.'],
  ['06', 'Payment Verify', 'Customer payment SMS এলে Android app data sync করবে, তারপর dashboard থেকে transaction status দেখা যাবে.']
];

const documentationNotes = [
  'Android app home screen-এ server/API link দেখানো হয় না.',
  'Logout করলে app local session clear করে এবং server session revoke করার চেষ্টা করে.',
  'Website credential matched admin payment SMS পেলে unlock হয়.',
  'Payment verify করতে transaction ID এবং amount মিলতে হবে.'
];

const sidebarItems = [
  'Dashboard', 'Add Funds', 'Payment Link', 'Transactions', 'Invoice', 'Data', 'Brands', 'Devices',
  'Payment Settings', 'Others', 'Affiliates', 'Support Tickets', 'Plans', 'My Plan', 'Currency',
  'Android App', 'Home Page', 'SMS List', 'Developer Docs', 'Our Support'
];

const adminMenuItems = ['Overview', 'Brand Requests', 'Billing Requests', 'Merchant Verify', 'Payments', 'History', 'Clients', 'Devices', 'Support', 'Settings'];

const defaultSettings = {
  currency: 'BDT',
  timezone: 'Asia/Dhaka',
  webhookUrl: '',
  successUrl: '',
  cancelUrl: '',
  autoVerify: true,
  paymentMethods: ['bkash', 'nagad', 'rocket'],
  invoicePrefix: 'INV',
  supportEmail: 'support@gatewayflow.local'
};

const emptyPortalData = {
  summary: {
    walletBalance: 0,
    completedAmount: 0,
    completedTodayAmount: 0,
    pendingAmount: 0,
    pendingTransactions: 0,
    pendingMerchantAmount: 0,
    pendingMerchantVerifications: 0,
    storedData: 0,
    completedTransactions: 0,
    unpaidInvoices: 0,
    openTickets: 0,
    billingRequests: 0,
    activeWebsites: 0,
    dueWebsites: 0,
    activeBrands: 0,
    pendingBrands: 0,
    devices: 0,
    monthlyFee: 60,
    brandOpeningFee: 60
  },
  adminPayment: {
    brandOpeningFee: 60,
    bkashNumber: '',
    nagadNumber: ''
  },
  appDownload: {
    url: '/gatewayflow-android.apk',
    unlocked: false
  },
  websites: [],
  payments: [],
  transactions: [],
  merchantHistory: [],
  renewals: [],
  billingRequests: [],
  invoices: [],
  devices: [],
  settings: defaultSettings,
  tickets: [],
  plans: [],
  docs: []
};

const emptyAdminData = {
  summary: {
    totalClients: 0,
    totalBrands: 0,
    pendingBrands: 0,
    activeBrands: 0,
    pendingBilling: 0,
    pendingMerchantVerifications: 0,
    totalSms: 0,
    totalSmsAmount: 0,
    adminIncomeAmount: 0,
    adminIncomeCount: 0,
    unusedAdminAmount: 0
  },
  config: {
    email: '',
    bkashNumber: '',
    nagadNumber: '',
    brandOpeningFee: 60,
    androidAppDownloadUrl: '/gatewayflow-android.apk'
  },
  clients: [],
  brands: [],
  billingRequests: [],
  payments: [],
  accountHistory: [],
  merchantVerifications: [],
  devices: [],
  tickets: []
};

function isAdminAccount(account) {
  const role = String(account?.role || account?.userRole || '').trim().toLowerCase();
  return role === 'admin';
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) || '');
  const [client, setClient] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [portalData, setPortalData] = useState(emptyPortalData);
  const [adminData, setAdminData] = useState(emptyAdminData);
  const [response, setResponse] = useState({ ready: true, server: 'Vercel gateway' });
  const [authMessage, setAuthMessage] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [websiteMessage, setWebsiteMessage] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [routeMessage, setRouteMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [view, setView] = useState(() => {
    const hashView = window.location.hash.replace('#', '').toLowerCase();
    if (hashView === 'admin') return 'admin';
    if (hashView === 'portal') return 'portal';
    if (localStorage.getItem(ADMIN_TOKEN_KEY)) return 'admin';
    if (localStorage.getItem(TOKEN_KEY)) return 'portal';
    return 'home';
  });
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [activeAdminMenu, setActiveAdminMenu] = useState('Overview');

  const stats = useMemo(() => {
    const summary = portalData.summary || emptyPortalData.summary;
    return {
      active: summary.activeWebsites ?? websites.filter((site) => site.subscriptionStatus === 'active').length,
      due: summary.dueWebsites ?? Math.max(websites.length - (summary.activeWebsites || 0), 0),
      dueAmount: (summary.dueWebsites || 0) * (summary.monthlyFee || 60)
    };
  }, [portalData.summary, websites]);

  useEffect(() => {
    if (token) loadClient();
  }, [token]);

  useEffect(() => {
    if (adminToken) loadAdmin(adminToken);
  }, [adminToken]);

  async function api(path, options = {}) {
    const headers = { Accept: 'application/json' };
    const init = { method: options.method || 'GET', headers };
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    else if (options.adminAuth) headers.Authorization = `Bearer ${adminToken}`;
    else if (options.auth) headers.Authorization = `Bearer ${token}`;
    if (options.apiKey) headers['X-API-Key'] = options.apiKey;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }

    try {
      const apiPath = `/api${path}`;
      const res = await fetch(`${API_BASE_URL}${apiPath}`, init);
      const data = await res.json().catch(() => ({}));
      setResponse({ path: apiPath, httpStatus: res.status, ...data });
      return { ok: res.ok, status: res.status, data };
    } catch (error) {
      const data = { success: false, error: 'Request failed', message: error.message };
      setResponse(data);
      return { ok: false, status: 0, data };
    }
  }

  async function loadAdmin(tokenOverride = adminToken || token) {
    setLoadingAdmin(true);
    const result = await api('/admin', { token: tokenOverride });
    setLoadingAdmin(false);
    if (!result.ok) {
      if (result.status === 401 || result.status === 403) await logoutAdmin(false, false);
      else setAdminMessage(errorMessage(result.data, 'Admin dashboard load failed'));
      return;
    }
    setAdmin(result.data.admin || admin);
    setAdminData(normalizeAdminData(result.data));
    setAdminMessage('');
  }

  async function authenticate(mode, formData) {
    setBusy(true);
    setAuthMessage(mode === 'register' ? 'Creating account...' : 'Logging in...');
    const result = await api(mode === 'register' ? '/client/register' : '/client/login', { method: 'POST', body: formData });
    setBusy(false);
    if (!result.ok || !result.data.token) {
      setAuthMessage(errorMessage(result.data, 'Authentication failed'));
      return;
    }
    localStorage.setItem(TOKEN_KEY, result.data.token);
    setToken(result.data.token);
    setClient(result.data.client || null);
    const account = result.data.client || null;
    const adminSession = isAdminAccount(account);
    if (adminSession) {
      localStorage.setItem(ADMIN_TOKEN_KEY, result.data.token);
      setAdminToken(result.data.token);
      setAdmin(account);
      setAdminData(normalizeAdminData({
        admin: account,
        config: {
          ...emptyAdminData.config,
          email: account?.email || '',
          brandOpeningFee: account?.brandOpeningFee || emptyAdminData.config.brandOpeningFee
        }
      }));
      setView('admin');
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setAdminToken('');
      setAdmin(null);
      setAdminData(emptyAdminData);
      setView('portal');
    }
    setAuthMessage('Welcome in.');
  }

  async function loadClient() {
    setLoadingPortal(true);
    const result = await api('/client/me?view=dashboard', { auth: true });
    setLoadingPortal(false);
    if (!result.ok) {
      if (result.status === 401 || result.status === 403) await logout(false, false);
      return;
    }
    setClient(result.data.client || null);
    setWebsites(result.data.websites || []);
    setPortalData(normalizePortalData(result.data));
  }

  async function logout(goHome = true, revokeToken = true) {
    const currentToken = token;
    if (revokeToken && currentToken) {
      await api('/client/logout', { method: 'POST', token: currentToken });
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken('');
    setClient(null);
    setWebsites([]);
    setPortalData(emptyPortalData);
    setAdminToken('');
    setAdmin(null);
    setAdminData(emptyAdminData);
    setResponse({ success: true, message: 'Logged out' });
    if (goHome) setView('home');
  }

  async function logoutAdmin(goHome = true, revokeToken = true) {
    const currentToken = adminToken || token;
    if (revokeToken && currentToken) {
      await api('/logout', { method: 'POST', token: currentToken });
    }
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setAdminToken('');
    setAdmin(null);
    setAdminData(emptyAdminData);
    setAdminMessage('');
    setToken('');
    setClient(null);
    setWebsites([]);
    setPortalData(emptyPortalData);
    setResponse({ success: true, message: 'Admin logged out' });
    if (goHome) setView('home');
  }

  async function updateAdminBrand(payload) {
    setAdminMessage('Saving brand update...');
    const result = await api('/admin', { method: 'PATCH', adminAuth: true, body: { action: 'brand', ...payload } });
    if (!result.ok) {
      setAdminMessage(errorMessage(result.data, 'Brand update failed'));
      return false;
    }
    setAdminMessage(result.data.message || 'Brand updated.');
    await loadAdmin();
    return true;
  }

  async function updateAdminUser(payload) {
    setAdminMessage('Saving user update...');
    const result = await api('/admin', { method: 'PATCH', adminAuth: true, body: { action: 'user', ...payload } });
    if (!result.ok) {
      setAdminMessage(errorMessage(result.data, 'User update failed'));
      return false;
    }
    setAdminMessage('User updated.');
    await loadAdmin();
    return true;
  }

  async function updateAdminPayment(id, status) {
    setAdminMessage('Updating payment record...');
    const result = await api('/payments', { method: 'PATCH', adminAuth: true, body: { id, status } });
    if (!result.ok) {
      setAdminMessage(errorMessage(result.data, 'Payment update failed'));
      return false;
    }
    setAdminMessage('Payment record updated.');
    await loadAdmin();
    return true;
  }

  async function updateAdminMerchantVerification(payload) {
    setAdminMessage('Updating merchant verification...');
    const result = await api('/admin', { method: 'PATCH', adminAuth: true, body: { action: 'merchantVerification', ...payload } });
    if (!result.ok) {
      setAdminMessage(errorMessage(result.data, 'Merchant verification update failed'));
      return false;
    }
    setAdminMessage(result.data.message || 'Merchant verification updated.');
    await loadAdmin();
    return true;
  }

  async function addWebsite(formData) {
    setWebsiteMessage('Adding website...');
    const result = await api('/client/websites', { method: 'POST', auth: true, body: formData });
    if (!result.ok) {
      setWebsiteMessage(errorMessage(result.data, 'Website add failed'));
      return false;
    }
    setWebsiteMessage(result.data.message || 'Brand saved. API key unlocks when admin SMS payment matches.');
    await loadClient();
    setActiveMenu(result.data.autoApproved ? 'Developer Docs' : 'Add Funds');
    return true;
  }

  async function renewWebsite(site, transactionId) {
    const amount = Number(site.brandCharge || site.monthlyFee || portalData.adminPayment.brandOpeningFee || 60);
    const result = await api('/client/me?resource=billing', {
      method: 'POST',
      auth: true,
      body: { websiteId: site.id, transaction_id: transactionId, amount, months: 1 }
    });
    if (!result.ok) return errorMessage(result.data, 'Renew failed');
    await loadClient();
    return result.data.message || 'Payment TrxID saved. Access will update when admin SMS matches.';
  }

  async function verifyPayment(payload) {
    const site = websites.find((item) => item.id === payload.websiteId);
    if (!site) {
      setCheckoutMessage('Select a website first.');
      return;
    }
    setCheckoutMessage('Verifying payment...');
    const result = await api('/merchant/verify', {
      method: 'POST',
      apiKey: site.apiKey,
      body: {
        domain: site.domain,
        transaction_id: payload.transactionId,
        amount: Number(payload.amount),
        order_id: payload.orderId,
        seller_name: payload.sellerName,
        buyer_name: payload.buyerName,
        buyer_address: payload.buyerAddress,
        return_url: payload.returnUrl
      }
    });
    if (!result.ok || !result.data.success) {
      setCheckoutMessage(errorMessage(result.data, 'Payment verification failed'));
      return;
    }
    setCheckoutMessage(paymentVerificationMessage(result.data));
    await loadClient();
  }

  async function saveSettings(settings) {
    setRouteMessage('Saving settings...');
    const result = await api('/client/me?resource=settings', { method: 'PATCH', auth: true, body: settings });
    if (!result.ok) {
      setRouteMessage(errorMessage(result.data, 'Settings save failed'));
      return false;
    }
    setRouteMessage('Settings saved.');
    await loadClient();
    return true;
  }

  async function createTicket(ticket) {
    setRouteMessage('Creating support ticket...');
    const result = await api('/client/me?resource=support', { method: 'POST', auth: true, body: ticket });
    if (!result.ok) {
      setRouteMessage(errorMessage(result.data, 'Ticket create failed'));
      return false;
    }
    setRouteMessage('Support ticket created.');
    await loadClient();
    return true;
  }

  if (view === 'portal') {
    return (
      <Portal
        token={token}
        client={client}
        websites={websites}
        portalData={portalData}
        stats={stats}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        response={response}
        authMessage={authMessage}
        websiteMessage={websiteMessage}
        checkoutMessage={checkoutMessage}
        routeMessage={routeMessage}
        busy={busy}
        loadingPortal={loadingPortal}
        onHome={() => setView('home')}
        onLogout={logout}
        onRefresh={loadClient}
        onAuth={authenticate}
        onAddWebsite={addWebsite}
        onRenewWebsite={renewWebsite}
        onVerifyPayment={verifyPayment}
        onSaveSettings={saveSettings}
        onCreateTicket={createTicket}
      />
    );
  }

  if (view === 'admin') {
    return (
      <AdminDashboard
        adminToken={adminToken}
        admin={admin}
        adminData={adminData}
        activeAdminMenu={activeAdminMenu}
        setActiveAdminMenu={setActiveAdminMenu}
        adminMessage={adminMessage}
        busy={busy}
        loadingAdmin={loadingAdmin}
        onHome={() => setView('home')}
        onOpenPortal={() => setView('portal')}
        onLogout={logoutAdmin}
        onRefresh={() => loadAdmin()}
        onAuth={(formData) => authenticate('login', formData)}
        onUpdateBrand={updateAdminBrand}
        onUpdateUser={updateAdminUser}
        onUpdatePayment={updateAdminPayment}
        onUpdateMerchantVerification={updateAdminMerchantVerification}
      />
    );
  }

  const isAdminSession = Boolean(adminToken || (client && isAdminAccount(client)));

  return (
    <Landing
      hasClientSession={Boolean(token)}
      hasAdminSession={isAdminSession}
      onOpenPortal={() => setView('portal')}
      onOpenAdmin={() => setView('admin')}
      onLogout={() => logout(false)}
      onLogoutAdmin={() => logoutAdmin(false)}
    />
  );
}

function Landing({ hasClientSession, hasAdminSession, onOpenPortal, onOpenAdmin, onLogout, onLogoutAdmin }) {
  return (
    <main className="site-shell">
      <header className="top-nav">
        <a className="brand" href="#home"><span>G</span>GatewayFlow</a>
        <nav>
          {['Home', 'Features', 'Guide', 'Documentation', 'Pricing', 'Blog'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</a>
          ))}
        </nav>
        <div className="top-actions">
          <button type="button" className="ghost-button" onClick={onOpenAdmin}>Admin</button>
          <button type="button" onClick={onOpenPortal}>Dashboard</button>
          {hasClientSession ? <button type="button" className="danger-button" onClick={onLogout}>Logout</button> : null}
          {hasAdminSession ? <button type="button" className="danger-button" onClick={onLogoutAdmin}>Admin Logout</button> : null}
        </div>
      </header>

      <section id="home" className="hero-section">
        <LineBurst />
        <div className="hero-copy">
          <p className="eyebrow">Payment automation for Bangladesh</p>
          <h1>Effortlessly manage customers with payment automation.</h1>
          <p>Experience efficient and secure payment solutions for your business with Android SMS forwarding, transaction verification, and developer APIs.</p>
          <div className="button-row">
            <button type="button" onClick={onOpenPortal}>Open Portal</button>
            <button type="button" className="ghost-button" onClick={onOpenAdmin}>Admin Panel</button>
            {hasClientSession ? <button type="button" className="danger-button" onClick={onLogout}>Logout</button> : null}
          </div>
        </div>
        <div className="hero-visual">
          <div className="phone-preview">
            <span className="notch" />
            <div className="ticket success"><small>Success</small><strong>Tk 500.00</strong><span>DDR0KZ5CDU</span></div>
            <div className="ticket pending"><small>Pending</small><strong>Tk 300.00</strong><span>Awaiting Sync</span></div>
          </div>
          <div className="float-card one"><small>API</small><strong>Live Verify</strong></div>
          <div className="float-card two"><small>Android</small><strong>SMS Connected</strong></div>
        </div>
      </section>

      <section id="features" className="section-block">
        <SectionIntro eyebrow="Features" title="Payment Gateway Automation Features" text="Streamline payment processing with powerful automation tools, secure transaction checks, instant updates, and reliable monitoring." />
        <div className="feature-grid">
          {featureCards.map(([title, text], index) => <FeatureCard key={title} index={index} title={title} text={text} />)}
        </div>
      </section>

      <section className="split-section">
        <div className="analytics-art"><span /><span /><span /><span /><span /></div>
        <div>
          <p className="eyebrow">Powerful automation</p>
          <h2>Streamline transactions with payment automation.</h2>
          <p>Unlock a secure and modern interface that simplifies complex payment processes, reduces manual errors, and improves customer experience.</p>
          <div className="metric-grid">
            <Metric value="0+" label="Happy Clients" />
            <Metric value="04" label="Transactions" />
            <Metric value="0+" label="Reviews" />
            <Metric value="8+" label="Methods" />
          </div>
        </div>
      </section>

      <section id="guide" className="section-block">
        <SectionIntro eyebrow="Guide" title="How it works - 3 easy steps" text="Create an account, connect wallet credentials, install the Android app, and start automating payment verification." />
        <div className="step-grid">
          {guideSteps.map(([num, title, text]) => <StepCard key={num} num={num} title={title} text={text} />)}
        </div>
      </section>

      <DocumentationSection />

      <section id="pricing" className="section-block">
        <SectionIntro eyebrow="Pricing" title="Best and simple pricing" text="Choose a package for your site count and duration. Each plan supports unlimited transactions and free support." />
        <div className="pricing-grid">
          {pricingPlans.map(([name, duration, price, sites], index) => (
            <article className={`price-card ${index === 3 ? 'hot' : ''}`} key={name}>
              <div className="price-icon" />
              <h3>{name}</h3>
              <p>{duration}</p>
              <strong>{price}</strong>
              <ul>
                <li>{sites}</li>
                <li>Unlimited Transactions</li>
                <li>Personal, Agent, and Merchant Options</li>
                <li>Free Support</li>
              </ul>
              <button type="button" onClick={onOpenPortal}>Buy Now</button>
            </article>
          ))}
        </div>
        <p className="pricing-note">Not sure what to choose? Check all plan packages inside the portal.</p>
      </section>

      <section id="developer-page" className="split-section cta-section">
        <div>
          <LineBurst />
          <p className="eyebrow">Automation</p>
          <h2>Experience the power of payment automation.</h2>
          <p>Use secure dashboard credentials, Android app login for SMS forwarding, and workspace tools for websites, invoices, plans, and payment settings.</p>
          <button type="button" onClick={onOpenPortal}>Get Started</button>
        </div>
        <div className="layout-preview">
          <div><span>Checkout</span><strong>Tk 1,400.00</strong><small>bKash, Nagad, Rocket</small></div>
          <div><span>Verification</span><strong>Real-time Sync</strong><small>Transaction ID + amount</small></div>
        </div>
      </section>

      <section className="section-block supported-block">
        <SectionIntro eyebrow="Integrations" title="Our supported payment gateways" text="Connect trusted payment methods and popular platforms for seamless business transactions." />
        <TagCloud title="Gateways" tags={['bKash', 'Nagad', 'Rocket', 'Upay', 'Tap', 'Bank Transfer', 'Agent Wallet', 'Merchant Wallet']} />
        <TagCloud title="Platforms" tags={['PHP', 'Laravel', 'WordPress', 'WHMCS', 'Magento', 'Shopify', 'React', 'Angular', 'SMM Panels', 'Custom Apps']} />
      </section>

      <section id="blog" className="section-block updates-block">
        <LineBurst />
        <SectionIntro eyebrow="Latest Updates" title="Build faster with payment automation" text="Automate payments with a seamless, secure, and modern interface for business operators and developers." />
        <div className="updates-grid">
          <UpdateCard title="Unlock automated payments" label="9K+ Automation" text="Reduce manual payment checks with Android SMS forwarding and API verification." />
          <UpdateCard title="User-friendly design" label="Interface" text="Manage wallets, sites, credentials, and transaction reports from one workspace." />
          <UpdateCard title="Instant transaction updates" label="Real-Time Sync" text="Keep dashboards and merchant checkouts aligned with the latest payment state." />
        </div>
      </section>

      <footer className="site-footer">
        <div><a className="brand" href="#home"><span>G</span>GatewayFlow</a><p>support@gatewayflow.local</p></div>
        <div><h4>Useful Links</h4><a href="#home">Home</a><a href="#documentation">Documentation</a><a href="#pricing">Pricing</a><a href="#blog">Blog</a></div>
        <div><h4>Help and Support</h4><a href="#guide">How it works</a><a href="#features">FAQs</a><a href="#documentation">Terms and conditions</a><a href="#documentation">Privacy Policy</a></div>
        <p className="copyright">© Copyrights 2026. All rights reserved.</p>
      </footer>
    </main>
  );
}

function DocumentationSection() {
  return (
    <section id="documentation" className="section-block docs-section">
      <SectionIntro
        eyebrow="Documentation"
        title="সহজ সেটআপ ডকুমেন্ট"
        text="শুধু দরকারি ধাপগুলো রাখা হয়েছে, যাতে client, admin, এবং Android app setup দ্রুত বুঝতে পারেন."
      />
      <div className="doc-flow" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="doc-grid">
        {documentationSteps.map(([num, title, text], index) => (
          <article className="doc-card" style={{ '--delay': `${index * 0.12}s` }} key={num}>
            <span className="doc-num">{num}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="doc-note-panel">
        <div>
          <p className="eyebrow">Important</p>
          <h3>Security and usage notes</h3>
        </div>
        <ul>
          {documentationNotes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      </div>
    </section>
  );
}

function Portal(props) {
  const { token, activeMenu, setActiveMenu, onHome, onLogout } = props;
  return (
    <main className={`portal-shell ${token ? '' : 'portal-login-shell'}`}>
      {token ? (
        <aside className="portal-sidebar">
          <button type="button" className="brand sidebar-brand" onClick={onHome}><span>G</span>GatewayFlow</button>
          <div className="theme-pill">light</div>
          <nav>
            {sidebarItems.map((item) => <button type="button" key={item} className={activeMenu === item ? 'active' : ''} onClick={() => setActiveMenu(item)}>{item}</button>)}
          </nav>
        </aside>
      ) : null}
      <section className="portal-main">
        <header className="portal-topbar">
          <div><p className="eyebrow">Dashboard</p><h1>{token ? activeMenu : 'Client Login'}</h1></div>
          <div className="portal-actions">
            {token ? <button type="button" className="ghost-button" onClick={props.onRefresh}>Refresh</button> : null}
            {token ? <button type="button" className="danger-button" onClick={() => onLogout(true)}>Logout</button> : <button type="button" onClick={onHome}>Home</button>}
          </div>
        </header>
        {token ? <DashboardContent {...props} /> : <PortalAuth {...props} />}
      </section>
    </main>
  );
}

function PortalAuth({ onAuth, authMessage, busy, onHome }) {
  return (
    <section className="portal-auth-grid">
      <div className="auth-intro-card">
        <p className="eyebrow">Client Portal</p>
        <h2>Login or create your merchant account.</h2>
        <p>After login, manage websites, renew plans, copy API keys, verify payments, and connect the Android app.</p>
        <button type="button" className="ghost-button" onClick={onHome}>Back to Home</button>
      </div>
      <AuthPanel onSubmit={onAuth} message={authMessage} busy={busy} />
    </section>
  );
}

function AuthPanel({ onSubmit, message, busy }) {
  return (
    <section className="auth-grid">
      <AuthForm title="Login" eyebrow="Existing client" mode="login" busy={busy} onSubmit={onSubmit} />
      <AuthForm title="Create Account" eyebrow="New merchant" mode="register" busy={busy} onSubmit={onSubmit} />
      {message ? <p className="wide-message panel">{textMessage(message)}</p> : null}
    </section>
  );
}
function AuthForm({ title, eyebrow, mode, busy, onSubmit }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  return (
    <form className={`panel form-card ${isRegister ? 'accent-card' : ''}`} onSubmit={(event) => { event.preventDefault(); onSubmit(mode, form); }}>
      <p className="eyebrow">{eyebrow}</p><h2>{title}</h2>
      {isRegister ? <><label htmlFor="registerName">Name</label><input id="registerName" value={form.name} onChange={(event) => update('name', event.target.value)} required /></> : null}
      <label htmlFor={`${mode}Email`}>Email</label><input id={`${mode}Email`} type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete={isRegister ? 'email' : 'username'} required />
      <label htmlFor={`${mode}Password`}>Password</label><input id={`${mode}Password`} type="password" minLength={isRegister ? 10 : undefined} value={form.password} onChange={(event) => update('password', event.target.value)} autoComplete={isRegister ? 'new-password' : 'current-password'} required />
      <button type="submit" disabled={busy}>{busy ? 'Please wait...' : title}</button>
    </form>
  );
}

function AdminDashboard(props) {
  const { adminToken, activeAdminMenu, setActiveAdminMenu, onHome, onOpenPortal, onLogout } = props;
  return (
    <main className={`portal-shell admin-shell ${adminToken ? '' : 'portal-login-shell'}`}>
      {adminToken ? (
        <aside className="portal-sidebar">
          <button type="button" className="brand sidebar-brand" onClick={onHome}><span>G</span>GatewayFlow</button>
          <div className="theme-pill">admin console</div>
          <nav>
            {adminMenuItems.map((item) => <button type="button" key={item} className={activeAdminMenu === item ? 'active' : ''} onClick={() => setActiveAdminMenu(item)}>{item}</button>)}
          </nav>
        </aside>
      ) : null}
      <section className="portal-main">
        <header className="portal-topbar">
          <div><p className="eyebrow">Admin Dashboard</p><h1>{adminToken ? activeAdminMenu : 'Admin Login'}</h1></div>
          <div className="portal-actions">
            <button type="button" className="ghost-button" onClick={onOpenPortal}>Client Portal</button>
            {adminToken ? <button type="button" className="ghost-button" onClick={props.onRefresh}>Refresh</button> : null}
            {adminToken ? <button type="button" className="danger-button" onClick={() => onLogout(true)}>Logout</button> : <button type="button" onClick={onHome}>Home</button>}
          </div>
        </header>
        {adminToken ? <AdminContent {...props} /> : <AdminAuth {...props} />}
      </section>
    </main>
  );
}

function AdminAuth({ onAuth, adminMessage, busy, onHome }) {
  return (
    <section className="portal-auth-grid">
      <div className="auth-intro-card">
        <p className="eyebrow">Control Room</p>
        <h2>Same login for client and admin.</h2>
        <p>Sign in with the normal account form. If the account role is admin, this dashboard opens automatically and client access stays available.</p>
        <button type="button" className="ghost-button" onClick={onHome}>Back to Home</button>
      </div>
      <section className="auth-grid">
        <AuthForm title="Login" eyebrow="Same account" mode="login" busy={busy} onSubmit={(_, form) => onAuth(form)} />
        {adminMessage ? <p className="wide-message panel">{textMessage(adminMessage)}</p> : null}
      </section>
    </section>
  );
}

function AdminContent(props) {
  const data = normalizeAdminData(props.adminData);
  const banner = props.loadingAdmin ? 'Refreshing admin dashboard data...' : props.adminMessage;

  return (
    <div className="dashboard-content admin-content">
      <Message text={banner} />
      {props.activeAdminMenu === 'Overview' ? <AdminOverview data={data} onUpdateBrand={props.onUpdateBrand} onUpdatePayment={props.onUpdatePayment} onUpdateMerchantVerification={props.onUpdateMerchantVerification} /> : null}
      {props.activeAdminMenu === 'Brand Requests' ? <AdminBrandsPanel data={data} onUpdateBrand={props.onUpdateBrand} /> : null}
      {props.activeAdminMenu === 'Billing Requests' ? <AdminBillingPanel data={data} onUpdateBrand={props.onUpdateBrand} /> : null}
      {props.activeAdminMenu === 'Merchant Verify' ? <AdminMerchantVerificationPanel data={data} onUpdateMerchantVerification={props.onUpdateMerchantVerification} /> : null}
      {props.activeAdminMenu === 'Payments' ? <AdminPaymentsPanel data={data} onUpdatePayment={props.onUpdatePayment} /> : null}
      {props.activeAdminMenu === 'History' ? <AdminHistoryPanel data={data} /> : null}
      {props.activeAdminMenu === 'Clients' ? <AdminClientsPanel data={data} onUpdateUser={props.onUpdateUser} /> : null}
      {props.activeAdminMenu === 'Devices' ? <AdminDevicesPanel data={data} /> : null}
      {props.activeAdminMenu === 'Support' ? <AdminSupportPanel data={data} /> : null}
      {props.activeAdminMenu === 'Settings' ? <AdminSettingsPanel data={data} /> : null}
    </div>
  );
}

function AdminOverview({ data, onUpdateBrand, onUpdatePayment, onUpdateMerchantVerification }) {
  const pendingBrands = data.brands.filter(isPendingBrand).slice(0, 6);
  const pendingBilling = data.billingRequests.filter(isPendingBilling).slice(0, 6);
  const pendingMerchant = data.merchantVerifications.filter(isPendingMerchantVerification).slice(0, 6);
  return (
    <>
      <section className="wallet-grid">
        <WalletCard label="Total Clients" value={data.summary.totalClients} sub={`${data.clients.length} recent accounts`} tone="green" />
        <WalletCard label="Total Brands" value={data.summary.totalBrands} sub={`${data.summary.activeBrands} active brands`} tone="blue" />
        <WalletCard label="Pending Reviews" value={data.summary.pendingBrands + data.summary.pendingBilling + data.summary.pendingMerchantVerifications} sub={`${data.summary.pendingMerchantVerifications} merchant verifications`} tone="amber" />
        <WalletCard label="SMS Volume" value={formatMoney(data.summary.totalSmsAmount)} sub={`${data.summary.totalSms} stored SMS records`} tone="ink" />
      </section>
      <section className="mini-stat-grid">
        <MiniStat label="Active Brands" value={data.summary.activeBrands} sub="Approved and unlocked" />
        <MiniStat label="Pending Billing" value={data.summary.pendingBilling} sub="Waiting for admin action" />
        <MiniStat label="Pending Merchant" value={data.summary.pendingMerchantVerifications} sub="Waiting for SMS or manual approval" />
        <MiniStat label="Admin Account" value={formatMoney(data.summary.adminIncomeAmount)} sub={`${data.summary.adminIncomeCount} admin SMS records`} />
      </section>
      <section className="portal-grid-two align-start">
        <AdminBrandQueue items={pendingBrands} onUpdateBrand={onUpdateBrand} />
        <AdminBillingQueue items={pendingBilling} onUpdateBrand={onUpdateBrand} />
      </section>
      <section className="panel">
        <div className="section-title"><div><p className="eyebrow">Merchant Queue</p><h2>Pending payment verifications</h2></div><span className="pill">{pendingMerchant.length} pending</span></div>
        <AdminMerchantVerificationTable items={pendingMerchant} onUpdateMerchantVerification={onUpdateMerchantVerification} />
      </section>
      <section className="panel">
        <div className="section-title"><div><p className="eyebrow">Recent Payments</p><h2>Latest SMS records</h2></div><span className="pill">{data.payments.length} records</span></div>
        <AdminPaymentsTable items={data.payments.slice(0, 8)} onUpdatePayment={onUpdatePayment} />
      </section>
    </>
  );
}

function AdminBrandQueue({ items, onUpdateBrand }) {
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Brand Queue</p><h2>Needs approval</h2></div><span className="pill">{items.length} pending</span></div>
      <AdminBrandTable items={items} onUpdateBrand={onUpdateBrand} compact />
    </section>
  );
}

function AdminBillingQueue({ items, onUpdateBrand }) {
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Billing Queue</p><h2>Renewal approvals</h2></div><span className="pill">{items.length} pending</span></div>
      <AdminBillingTable items={items} onUpdateBrand={onUpdateBrand} compact />
    </section>
  );
}

function AdminBrandsPanel({ data, onUpdateBrand }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const items = data.brands.filter((brand) => {
    const statusOk = status ? brand.brandStatus === status : true;
    return statusOk && searchMatches(brand, ['name', 'domain', 'clientEmail', 'walletNumber', 'brandStatus'], query);
  });

  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Brands</p><h2>Merchant websites</h2></div><span className="pill">{items.length} shown</span></div>
      <div className="admin-filters">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search domain, client, wallet..." />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="pending_payment">Pending payment</option>
          <option value="pending_review">Pending review</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <AdminBrandTable items={items} onUpdateBrand={onUpdateBrand} />
    </section>
  );
}

function AdminBillingPanel({ data, onUpdateBrand }) {
  const [status, setStatus] = useState('');
  const items = data.billingRequests.filter((item) => (status ? item.status === status : true));
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Billing</p><h2>Payment requests</h2></div><span className="pill">{items.length} requests</span></div>
      <div className="admin-filters single">
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="pending_review">Pending review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="active">Active</option>
        </select>
      </div>
      <AdminBillingTable items={items} onUpdateBrand={onUpdateBrand} />
    </section>
  );
}

function AdminMerchantVerificationPanel({ data, onUpdateMerchantVerification }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const items = data.merchantVerifications.filter((item) => {
    const statusOk = status ? item.status === status : true;
    return statusOk && searchMatches(item, ['transaction_id', 'domain', 'clientEmail', 'clientName', 'order_id', 'status', 'adminNote'], query);
  });
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Merchant Verify</p><h2>Payment verification history</h2></div><span className="pill">{items.length} records</span></div>
      <div className="admin-filters">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search TrxID, domain, client, order..." />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="pending_sms">Pending SMS</option>
          <option value="verified">Verified</option>
          <option value="manual_approved">Manual approved</option>
          <option value="manual_accepted">Manual accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <AdminMerchantVerificationTable items={items} onUpdateMerchantVerification={onUpdateMerchantVerification} />
    </section>
  );
}

function AdminPaymentsPanel({ data, onUpdatePayment }) {
  const [query, setQuery] = useState('');
  const items = data.payments.filter((payment) => searchMatches(payment, ['transaction_id', 'provider', 'sender', 'sourceNumber', 'rawMessage', 'status'], query));
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Payments</p><h2>Android SMS records</h2></div><span className="pill">{items.length} records</span></div>
      <div className="admin-filters single">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transaction, sender, raw SMS..." />
      </div>
      <AdminPaymentsTable items={items} onUpdatePayment={onUpdatePayment} />
    </section>
  );
}

function AdminHistoryPanel({ data }) {
  const [query, setQuery] = useState('');
  const items = data.accountHistory.filter((item) => searchMatches(item, ['transaction_id', 'type', 'domain', 'brandName', 'clientEmail', 'provider', 'sender', 'status'], query));
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Account History</p><h2>Admin payment ledger</h2></div><span className="pill">{formatMoney(data.summary.adminIncomeAmount)}</span></div>
      <section className="mini-stat-grid">
        <MiniStat label="Admin SMS Records" value={data.summary.adminIncomeCount} sub="Payments received on admin wallet" />
        <MiniStat label="Used Amount" value={formatMoney(Math.max((data.summary.adminIncomeAmount || 0) - (data.summary.unusedAdminAmount || 0), 0))} sub="Applied to brand opening or renewal" />
        <MiniStat label="Unused Amount" value={formatMoney(data.summary.unusedAdminAmount)} sub="Available for matching" />
      </section>
      <div className="admin-filters single">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search TrxID, brand, client, provider..." />
      </div>
      <AdminHistoryTable items={items} />
    </section>
  );
}

function AdminClientsPanel({ data, onUpdateUser }) {
  const [query, setQuery] = useState('');
  const items = data.clients.filter((client) => searchMatches(client, ['name', 'email', 'role', 'status'], query));
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Clients</p><h2>User accounts</h2></div><span className="pill">{items.length} users</span></div>
      <div className="admin-filters single">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, role..." />
      </div>
      <AdminClientsTable items={items} onUpdateUser={onUpdateUser} />
    </section>
  );
}

function AdminDevicesPanel({ data }) {
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Devices</p><h2>Android SMS forwarders</h2></div><span className="pill">{data.devices.length} devices</span></div>
      {!data.devices.length ? <div className="empty-state">No Android devices have connected yet.</div> : (
        <div className="table-wrap"><table><thead><tr><th>Device</th><th>Model</th><th>Status</th><th>Last Seen</th><th>Total SMS</th></tr></thead><tbody>{data.devices.map((device) => (
          <tr key={device.id || device.deviceId}><td><strong>{device.name}</strong><small>{device.deviceId}</small></td><td>{device.manufacturer} {device.model}</td><td><span className={`badge ${statusBadgeClass(device.status)}`}>{device.status}</span></td><td>{formatDate(device.lastSeenAt)}</td><td>{device.totalSms}</td></tr>
        ))}</tbody></table></div>
      )}
    </section>
  );
}

function AdminSupportPanel({ data }) {
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Support</p><h2>Client tickets</h2></div><span className="pill">{data.tickets.length} tickets</span></div>
      {!data.tickets.length ? <div className="empty-state">No support tickets yet.</div> : (
        <div className="table-wrap"><table><thead><tr><th>Subject</th><th>Category</th><th>Status</th><th>Message</th><th>Created</th></tr></thead><tbody>{data.tickets.map((ticket) => (
          <tr key={ticket.id}><td><strong>{ticket.subject}</strong></td><td>{ticket.category}</td><td><span className={`badge ${statusBadgeClass(ticket.status)}`}>{ticket.status}</span></td><td className="admin-message-cell">{ticket.message}</td><td>{formatDate(ticket.createdAt)}</td></tr>
        ))}</tbody></table></div>
      )}
    </section>
  );
}

function AdminSettingsPanel({ data }) {
  const config = data.config;
  return (
    <section className="portal-grid-two align-start">
      <InfoPanel title="Admin Wallets" eyebrow="Settings" text="These values come from the server environment and are used by client brand opening instructions." items={[`Admin email: ${config.email || 'Not configured'}`, `bKash: ${config.bkashNumber || 'Not configured'}`, `Nagad: ${config.nagadNumber || 'Not configured'}`, `Brand opening fee: ${formatMoney(config.brandOpeningFee)}`]} />
      <InfoPanel title="System Assets" eyebrow="Runtime" text="Android app and recent portal records used by the workspace." items={[`Android app: ${config.androidAppDownloadUrl || '/gatewayflow-android.apk'}`, `Recent clients loaded: ${data.clients.length}`, `Recent brands loaded: ${data.brands.length}`]} />
    </section>
  );
}

function AdminBrandTable({ items = [], onUpdateBrand, compact = false }) {
  if (!items.length) return <div className="empty-state">No brands match this view.</div>;
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead><tr><th>Brand</th><th>Client</th>{compact ? null : <th>Wallet</th>}<th>Status</th><th>Paid Until</th><th>Actions</th></tr></thead>
        <tbody>{items.map((brand) => (
          <tr key={brand.id}>
            <td><strong>{brand.name || brand.domain}</strong><small>{brand.domain}</small></td>
            <td>{brand.clientEmail || '-'}<small>{brand.clientName || ''}</small></td>
            {compact ? null : <td>{brand.walletProvider || '-'} {brand.walletNumber || ''}<small>{brand.receiverName || ''}</small></td>}
            <td><span className={`badge ${statusBadgeClass(brand.brandStatus)}`}>{formatBrandStatus(brand.brandStatus)}</span><small>{brand.paymentStatus || 'unpaid'} / {formatMoney(brand.brandCharge || brand.monthlyFee)}</small></td>
            <td>{formatDate(brand.paidUntil)}</td>
            <td><AdminBrandActions brand={brand} onUpdateBrand={onUpdateBrand} /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function AdminBrandActions({ brand, onUpdateBrand }) {
  return (
    <div className="table-actions">
      <button type="button" className="small" onClick={() => onUpdateBrand({ websiteId: brand.id, brandStatus: 'active', paymentStatus: 'paid', months: 1, adminNote: 'Approved from admin dashboard' })}>Approve</button>
      <button type="button" className="ghost-button small" onClick={() => onUpdateBrand({ websiteId: brand.id, brandStatus: 'suspended', paymentStatus: 'unpaid', adminNote: 'Suspended by admin' })}>Suspend</button>
      <button type="button" className="danger-button small" onClick={() => onUpdateBrand({ websiteId: brand.id, brandStatus: 'rejected', paymentStatus: 'failed', adminNote: 'Rejected by admin' })}>Reject</button>
    </div>
  );
}

function AdminBillingTable({ items = [], onUpdateBrand, compact = false }) {
  if (!items.length) return <div className="empty-state">No billing requests match this view.</div>;
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead><tr><th>Brand</th><th>Client</th><th>TrxID</th>{compact ? null : <th>Note</th>}<th>Status</th><th>Actions</th></tr></thead>
        <tbody>{items.map((request) => (
          <tr key={request.id}>
            <td><strong>{request.domain || request.websiteId}</strong><small>{request.months || 1} month renewal</small></td>
            <td>{request.clientEmail || '-'}<small>{request.clientName || ''}</small></td>
            <td><strong>{request.transaction_id || '-'}</strong><small>{formatMoney(request.amount)}</small></td>
            {compact ? null : <td className="admin-message-cell">{request.note || request.adminNote || '-'}</td>}
            <td><span className={`badge ${statusBadgeClass(request.status)}`}>{formatBrandStatus(request.status)}</span><small>{formatDate(request.createdAt)}</small></td>
            <td>
              <div className="table-actions">
                <button type="button" className="small" onClick={() => onUpdateBrand({ billingRequestId: request.id, websiteId: request.websiteId, brandStatus: 'active', paymentStatus: 'paid', months: request.months || 1, adminNote: 'Billing approved from admin dashboard' })}>Approve</button>
                <button type="button" className="danger-button small" onClick={() => onUpdateBrand({ billingRequestId: request.id, websiteId: request.websiteId, brandStatus: 'rejected', paymentStatus: 'failed', adminNote: 'Billing rejected by admin' })}>Reject</button>
              </div>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function AdminMerchantVerificationTable({ items = [], onUpdateMerchantVerification }) {
  if (!items.length) return <div className="empty-state">No merchant verification records match this view.</div>;
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead><tr><th>Created</th><th>Brand</th><th>Client</th><th>TrxID</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{items.map((item) => (
          <tr key={item.id || item.transaction_id}>
            <td>{formatDate(item.createdAt || item.verifiedAt)}</td>
            <td><strong>{item.domain || '-'}</strong><small>{item.order_id || 'No order ID'}</small></td>
            <td>{item.clientEmail || '-'}<small>{item.clientName || ''}</small></td>
            <td><strong>{item.transaction_id}</strong><small>{item.sellerName || item.buyerName || '-'}</small></td>
            <td>{formatMoney(item.amount)}</td>
            <td><span className={`badge ${statusBadgeClass(item.status)}`}>{formatBrandStatus(item.status)}</span><small>{item.adminNote || item.source || ''}</small></td>
            <td>
              <div className="table-actions">
                <button type="button" className="small" onClick={() => onUpdateMerchantVerification({ id: item.id, status: 'manual_approved', adminNote: 'Manually approved from admin dashboard' })}>Approve</button>
                <button type="button" className="danger-button small" onClick={() => onUpdateMerchantVerification({ id: item.id, status: 'rejected', adminNote: 'Rejected from admin dashboard' })}>Reject</button>
              </div>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function AdminPaymentsTable({ items = [], onUpdatePayment }) {
  if (!items.length) return <div className="empty-state">No SMS payment records match this view.</div>;
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead><tr><th>Received</th><th>Provider</th><th>TrxID</th><th>Amount</th><th>Status</th><th>Raw SMS</th><th>Actions</th></tr></thead>
        <tbody>{items.map((payment) => (
          <tr key={payment.id || payment._id || payment.transaction_id}>
            <td>{formatDate(payment.receivedAt || payment.createdAt)}</td>
            <td>{payment.provider || payment.sender}<small>{payment.sourceNumber || payment.source_number || ''}</small></td>
            <td><strong>{payment.transaction_id}</strong><small>{payment.usedFor || 'unused'}</small></td>
            <td>{formatMoney(payment.amount)}</td>
            <td><span className={`badge ${statusBadgeClass(payment.status)}`}>{payment.status || 'received'}</span></td>
            <td className="admin-message-cell">{payment.rawMessage || payment.raw_message || '-'}</td>
            <td>
              <div className="table-actions">
                <button type="button" className="small" onClick={() => onUpdatePayment(payment.id || payment._id, 'verified')}>Verify</button>
                <button type="button" className="danger-button small" onClick={() => onUpdatePayment(payment.id || payment._id, 'rejected')}>Reject</button>
              </div>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function AdminHistoryTable({ items = [] }) {
  if (!items.length) return <div className="empty-state">No admin account history matches this view.</div>;
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead><tr><th>Received</th><th>Type</th><th>Brand</th><th>TrxID</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>{items.map((item) => (
          <tr key={item.id || item.transaction_id}>
            <td>{formatDate(item.receivedAt || item.createdAt)}</td>
            <td><strong>{item.type}</strong><small>{item.provider || item.sender || 'admin wallet'}</small></td>
            <td>{item.domain || '-'}<small>{item.clientEmail || item.brandName || ''}</small></td>
            <td><strong>{item.transaction_id}</strong><small>{item.usedFor || 'unused'}</small></td>
            <td>{formatMoney(item.amount)}</td>
            <td><span className={`badge ${statusBadgeClass(item.status)}`}>{item.status || 'received'}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function AdminClientsTable({ items = [], onUpdateUser }) {
  if (!items.length) return <div className="empty-state">No clients match this view.</div>;
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>{items.map((client) => (
          <tr key={client.id}>
            <td><strong>{client.name || 'Client'}</strong><small>{client.email}</small></td>
            <td><span className={`badge ${client.role === 'admin' ? 'active' : ''}`}>{client.role || 'user'}</span></td>
            <td><span className={`badge ${statusBadgeClass(client.status || 'active')}`}>{client.status || 'active'}</span></td>
            <td>{formatDate(client.createdAt)}</td>
            <td>
              <div className="table-actions">
                <button type="button" className="ghost-button small" onClick={() => onUpdateUser({ userId: client.id, role: client.role === 'admin' ? 'user' : 'admin' })}>{client.role === 'admin' ? 'Make User' : 'Make Admin'}</button>
                <button type="button" className={`${client.status === 'blocked' ? '' : 'danger-button'} small`} onClick={() => onUpdateUser({ userId: client.id, status: client.status === 'blocked' ? 'active' : 'blocked' })}>{client.status === 'blocked' ? 'Activate' : 'Block'}</button>
              </div>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function DashboardContent(props) {
  const data = normalizePortalData(props.portalData);
  const banner = props.loadingPortal ? 'Refreshing live dashboard data...' : props.routeMessage;

  return (
    <div className="dashboard-content">
      <Message text={banner} />
      {props.activeMenu === 'Dashboard' ? <OverviewContent {...props} portalData={data} /> : null}
      {props.activeMenu === 'Add Funds' ? <AddFundsPanel portalData={data} websites={props.websites} onRenewWebsite={props.onRenewWebsite} /> : null}
      {props.activeMenu === 'Payment Link' ? <PaymentLinkPanel {...props} portalData={data} /> : null}
      {props.activeMenu === 'Transactions' ? <TransactionsPanel portalData={data} /> : null}
      {props.activeMenu === 'Invoice' ? <InvoicesPanel portalData={data} /> : null}
      {props.activeMenu === 'Data' ? <DataPanel portalData={data} /> : null}
      {props.activeMenu === 'Brands' ? <BrandsPanel {...props} portalData={data} /> : null}
      {props.activeMenu === 'Devices' ? <DevicesPanel client={props.client} response={props.response} portalData={data} /> : null}
      {props.activeMenu === 'Payment Settings' ? <SettingsPanel settings={data.settings} onSave={props.onSaveSettings} /> : null}
      {props.activeMenu === 'Others' ? <OthersPanel response={props.response} portalData={data} /> : null}
      {props.activeMenu === 'Affiliates' ? <AffiliatesPanel client={props.client} portalData={data} /> : null}
      {props.activeMenu === 'Support Tickets' ? <SupportPanel portalData={data} onCreateTicket={props.onCreateTicket} /> : null}
      {props.activeMenu === 'Plans' ? <PlansPanel portalData={data} /> : null}
      {props.activeMenu === 'My Plan' ? <MyPlanPanel websites={props.websites} renewals={data.renewals} onRenew={props.onRenewWebsite} /> : null}
      {props.activeMenu === 'Currency' ? <CurrencyPanel settings={data.settings} onSave={props.onSaveSettings} /> : null}
      {props.activeMenu === 'Android App' ? <AndroidPanel client={props.client} response={props.response} portalData={data} /> : null}
      {props.activeMenu === 'Home Page' ? <HomePagePanel portalData={data} /> : null}
      {props.activeMenu === 'SMS List' ? <SmsListPanel portalData={data} /> : null}
      {props.activeMenu === 'Developer Docs' ? <DeveloperDocsPanel websites={props.websites} docs={data.docs} /> : null}
      {props.activeMenu === 'Our Support' ? <OurSupportPanel settings={data.settings} tickets={data.tickets} onCreateTicket={props.onCreateTicket} /> : null}

    </div>
  );
}

function WalletCard({ label, value, sub, tone }) { return <article className={`wallet-card ${tone}`}><span>{label}</span><strong>{value}</strong>{sub ? <small>{sub}</small> : null}</article>; }
function MiniStat({ label, value, sub }) { return <article className="mini-stat-card"><span>{label}</span><strong>{value}</strong><small>{sub}</small></article>; }

function OverviewContent({ client, websites, stats, portalData, websiteMessage, checkoutMessage, response, onAddWebsite, onRenewWebsite, onVerifyPayment }) {
  return (
    <>
      <SummaryCards portalData={portalData} websites={websites} stats={stats} />
      <section className="mini-stat-grid">
        <MiniStat label="Completed Transactions" value={portalData.summary.completedTransactions} sub={`Processed today ${formatMoney(portalData.summary.completedTodayAmount)}`} />
        <MiniStat label="Awaiting Processing" value={portalData.summary.pendingTransactions} sub={`${formatMoney(portalData.summary.pendingAmount)} waiting`} />
        <MiniStat label="Unpaid Invoices" value={portalData.summary.unpaidInvoices} sub={`${portalData.summary.dueWebsites} websites need renewal`} />
      </section>
      <section className="portal-grid-two"><WebsiteForm onSubmit={onAddWebsite} message={websiteMessage} adminPayment={portalData.adminPayment} /><CheckoutForm websites={websites} onSubmit={onVerifyPayment} message={checkoutMessage} /></section>
      <section className="portal-grid-two align-start"><WebsiteList websites={websites} onRenew={onRenewWebsite} /><AndroidCard client={client} response={response} devices={portalData.devices} websites={websites} /></section>
      <section className="panel transaction-panel"><div className="section-title"><div><p className="eyebrow">Transaction Report</p><h2>Merchant payment history</h2></div><span className="pill">{portalData.transactions.length} records</span></div><TransactionTable items={portalData.transactions} /></section>
    </>
  );
}

function SummaryCards({ portalData, websites, stats }) {
  const summary = portalData.summary;
  return (
    <section className="wallet-grid">
      <WalletCard label="Wallet Balance" value={formatMoney(summary.walletBalance)} tone="green" />
      <WalletCard label="Completed Transactions Amount" value={formatMoney(summary.completedAmount)} sub={`Completed today ${formatMoney(summary.completedTodayAmount)}`} tone="blue" />
      <WalletCard label="Pending Merchant Amount" value={formatMoney(summary.pendingMerchantAmount || summary.pendingAmount)} sub={`${summary.pendingMerchantVerifications || summary.pendingTransactions} awaiting approval`} tone="amber" />
      <WalletCard label="Stored Data" value={summary.storedData} sub={`${stats.active} active of ${websites.length} websites`} tone="ink" />
    </section>
  );
}

function AddFundsPanel({ portalData, websites, onRenewWebsite }) {
  return (
    <section className="portal-grid-two align-start">
      <InfoPanel title="Add Funds" eyebrow="Brand Charge" text="Send the exact opening charge to the admin wallet and submit the TrxID. If the admin SMS record matches, the brand activates without manual approval." items={[`Brand opening fee: ${formatMoney(portalData.adminPayment.brandOpeningFee || portalData.summary.brandOpeningFee)}`, `bKash: ${portalData.adminPayment.bkashNumber}`, `Nagad: ${portalData.adminPayment.nagadNumber}`, `Unpaid invoices: ${portalData.summary.unpaidInvoices}`]} />
      <section className="panel">
        <div className="section-title"><div><p className="eyebrow">Invoices</p><h2>Amounts waiting for payment</h2></div></div>
        <InvoiceTable items={portalData.invoices} />
        <BillingQuickSubmit websites={websites} onSubmit={onRenewWebsite} />
        <BillingRequestList items={portalData.billingRequests} />
      </section>
    </section>
  );
}

function BillingQuickSubmit({ websites = [], onSubmit }) {
  const [form, setForm] = useState({ websiteId: '', transactionId: '' });
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!form.websiteId && websites[0]?.id) setForm((current) => ({ ...current, websiteId: websites[0].id }));
  }, [websites, form.websiteId]);

  async function submit(event) {
    event.preventDefault();
    const site = websites.find((item) => item.id === form.websiteId);
    if (!site) {
      setMessage('Select a brand first.');
      return;
    }
    setMessage('Sending billing request...');
    setMessage(await onSubmit(site, form.transactionId.trim()));
    setForm((current) => ({ ...current, transactionId: '' }));
  }

  return (
    <form className="billing-submit-card" onSubmit={submit}>
      <h3>Submit payment TrxID</h3>
      <select value={form.websiteId} onChange={(event) => setForm({ ...form, websiteId: event.target.value })} required>{websites.length ? websites.map((site) => <option key={site.id} value={site.id}>{site.name || site.domain}</option>) : <option value="">Open a brand first</option>}</select>
      <input value={form.transactionId} placeholder="Admin payment transaction ID" onChange={(event) => setForm({ ...form, transactionId: event.target.value })} required />
      <button type="submit">Send For Approval</button>
      <Message text={message} />
    </form>
  );
}

function BillingRequestList({ items = [] }) {
  return (
    <div className="billing-list">
      <h3>Billing requests</h3>
      {!items.length ? <div className="empty-state compact-empty">No billing request submitted yet.</div> : items.map((item) => (
        <div className="route-card compact" key={item.id}>
          <strong>{item.domain || item.websiteId}</strong>
          <span>{item.transaction_id} · {formatMoney(item.amount)} · {item.status}</span>
        </div>
      ))}
    </div>
  );
}

function PaymentLinkPanel({ websites, checkoutMessage, onVerifyPayment, portalData }) {
  return (
    <section className="portal-grid-two align-start">
      <CheckoutForm websites={websites} onSubmit={onVerifyPayment} message={checkoutMessage} />
      <InfoPanel title="Live checkout rules" eyebrow="Payment Link" text="Use a website API key to verify customer payments after the Android app receives the SMS." items={[`${websites.length} websites available`, `${portalData.summary.completedTransactions} successful verifications`, `${portalData.summary.pendingMerchantVerifications} merchant verifications waiting`]} />
    </section>
  );
}

function TransactionsPanel({ portalData }) {
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Transactions</p><h2>Merchant payment history</h2></div><span className="pill">{portalData.summary.pendingMerchantVerifications} pending</span></div>
      <TransactionTable items={portalData.transactions} />
    </section>
  );
}

function InvoicesPanel({ portalData }) {
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Invoice</p><h2>Unpaid invoices</h2></div><span className="pill">{portalData.invoices.length} open</span></div>
      <InvoiceTable items={portalData.invoices} />
    </section>
  );
}

function DataPanel({ portalData }) {
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Data</p><h2>Raw Android SMS records</h2></div><span className="pill">{portalData.payments.length} recent</span></div>
      <PaymentDataTable items={portalData.payments} />
    </section>
  );
}

function BrandsPanel({ websites, websiteMessage, onAddWebsite, onRenewWebsite, portalData }) {
  return (
    <section className="portal-grid-two align-start">
      <WebsiteForm onSubmit={onAddWebsite} message={websiteMessage} adminPayment={portalData.adminPayment} />
      <WebsiteList websites={websites} onRenew={onRenewWebsite} />
    </section>
  );
}

function DevicesPanel({ client, response, portalData }) {
  return (
    <section className="portal-grid-two align-start">
      <DeviceList devices={portalData.devices} />
      <AndroidCard client={client} response={response} devices={portalData.devices} websites={portalData.websites} />
    </section>
  );
}

function SettingsPanel({ settings, onSave }) {
  return <SettingsForm title="Payment Settings" settings={settings} onSave={onSave} />;
}

function OthersPanel({ response, portalData }) {
  return (
    <section className="portal-grid-two align-start">
      <InfoPanel title="System Status" eyebrow="Others" text="This panel shows the last API response and important portal counters." items={[`Devices: ${portalData.summary.devices}`, `Open support tickets: ${portalData.summary.openTickets}`, `Stored SMS data: ${portalData.summary.storedData}`]} />
      <section className="panel"><p className="eyebrow">Last API Response</p><h2>Debug output</h2><pre>{JSON.stringify(response, null, 2)}</pre></section>
    </section>
  );
}

function AffiliatesPanel({ client, portalData }) {
  const code = `GF-${String(client?.id || client?.email || 'CLIENT').slice(-6).toUpperCase()}`;
  return <InfoPanel title="Affiliates" eyebrow="Growth" text="Invite merchants to use your gateway workspace. The referral report is ready for future commission tracking." items={[`Referral code: ${code}`, `Current websites: ${portalData.websites.length}`, `Verified volume: ${formatMoney(portalData.summary.completedAmount)}`]} />;
}

function SupportPanel({ portalData, onCreateTicket }) {
  return (
    <section className="portal-grid-two align-start">
      <SupportForm onCreateTicket={onCreateTicket} />
      <TicketList tickets={portalData.tickets} />
    </section>
  );
}

function PlansPanel({ portalData }) {
  return <PlansGrid plans={portalData.plans} />;
}

function MyPlanPanel({ websites, renewals, onRenew }) {
  return (
    <section className="portal-grid-two align-start">
      <WebsiteList websites={websites} onRenew={onRenew} />
      <RenewalList renewals={renewals} />
    </section>
  );
}

function CurrencyPanel({ settings, onSave }) {
  return <SettingsForm title="Currency" settings={settings} onSave={onSave} compact />;
}

function AndroidPanel({ client, response, portalData }) {
  return (
    <section className="portal-grid-two align-start">
      <AndroidCard client={client} response={response} devices={portalData.devices} websites={portalData.websites} />
      <InfoPanel title="Android setup" eyebrow="SMS System" text="Android download unlocks after a brand is active. Auto activation happens when admin payment TrxID and amount match the admin SMS history." items={['Brand must be active before app download', 'Login only, no Android registration', 'Each SMS includes transaction ID, amount, provider, raw message, and device ID']} />
    </section>
  );
}

function HomePagePanel({ portalData }) {
  return <InfoPanel title="Home Page" eyebrow="Public Website" text="The public landing page is connected to your real portal metrics and can be expanded into pricing/blog/documentation content." items={[`Supported plans: ${portalData.plans.length}`, `Supported docs: ${portalData.docs.length}`, `Live websites: ${portalData.summary.activeWebsites}`]} />;
}

function SmsListPanel({ portalData }) {
  const [query, setQuery] = useState('');
  const items = portalData.payments.filter((payment) => searchMatches(payment, ['transaction_id', 'provider', 'sender', 'sourceNumber', 'rawMessage', 'status'], query));
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">SMS List</p><h2>Android SMS records</h2></div><span className="pill">{items.length} records</span></div>
      <div className="admin-filters single">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transaction, sender, raw SMS..." />
      </div>
      <PaymentDataTable items={items} />
    </section>
  );
}

function DeveloperDocsPanel({ websites, docs }) {
  return (
    <section className="portal-grid-two align-start">
      <DocsList docs={docs} />
      <section className="panel"><p className="eyebrow">API Keys</p><h2>Website credentials</h2><ApiKeyList websites={websites} /></section>
    </section>
  );
}

function OurSupportPanel({ settings, tickets, onCreateTicket }) {
  return (
    <section className="portal-grid-two align-start">
      <InfoPanel title="Our Support" eyebrow="Help Desk" text="Create a ticket and keep the conversation connected to your client account." items={[`Support email: ${settings.supportEmail || 'support@gatewayflow.local'}`, `Open tickets: ${tickets.filter((ticket) => ticket.status !== 'closed').length}`, 'Typical response: within business hours']} />
      <SupportForm onCreateTicket={onCreateTicket} />
    </section>
  );
}

function WebsiteForm({ onSubmit, message, adminPayment = emptyPortalData.adminPayment }) {
  const [form, setForm] = useState({ name: '', domain: '', walletProvider: 'bkash', walletNumber: '', receiverName: '', transaction_id: '' });
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event) {
    event.preventDefault();
    const ok = await onSubmit(form);
    if (ok) setForm({ name: '', domain: '', walletProvider: 'bkash', walletNumber: '', receiverName: '', transaction_id: '' });
  }
  return (
    <form className="panel form-card" onSubmit={submit}>
      <p className="eyebrow">Brands</p><h2>Open Brand</h2>
      <div className="route-card compact">Opening charge {formatMoney(adminPayment.brandOpeningFee)}. Pay admin bKash {adminPayment.bkashNumber} or Nagad {adminPayment.nagadNumber}, then enter the TrxID for instant SMS matching.</div>
      <label htmlFor="websiteName">Brand name</label><input id="websiteName" value={form.name} placeholder="My Shop" onChange={(event) => update('name', event.target.value)} required />
      <label htmlFor="websiteDomain">Domain</label><input id="websiteDomain" value={form.domain} placeholder="example.com" onChange={(event) => update('domain', event.target.value)} required />
      <label htmlFor="walletProvider">Where will this brand receive money?</label><select id="walletProvider" value={form.walletProvider} onChange={(event) => update('walletProvider', event.target.value)} required><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="upay">Upay</option><option value="bank">Bank</option><option value="other">Other</option></select>
      <label htmlFor="walletNumber">Receiver number</label><input id="walletNumber" value={form.walletNumber} placeholder="017XXXXXXXX" onChange={(event) => update('walletNumber', event.target.value)} required />
      <label htmlFor="receiverName">Receiver account name</label><input id="receiverName" value={form.receiverName} placeholder="Shop owner or brand wallet name" onChange={(event) => update('receiverName', event.target.value)} />
      <label htmlFor="adminTransactionId">Admin payment TrxID</label><input id="adminTransactionId" value={form.transaction_id} placeholder="Payment transaction ID" onChange={(event) => update('transaction_id', event.target.value)} required />
      <button type="submit">Open Brand</button><Message text={message} />
    </form>
  );
}

function CheckoutForm({ websites, onSubmit, message }) {
  const [form, setForm] = useState({ websiteId: '', orderId: `ORDER-${Date.now().toString().slice(-6)}`, amount: '500', transactionId: '', sellerName: '', buyerName: '', buyerAddress: '', returnUrl: '' });
  useEffect(() => { if (!form.websiteId && websites[0]?.id) setForm((current) => ({ ...current, websiteId: websites[0].id })); }, [websites, form.websiteId]);
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  return (
    <form className="panel form-card checkout-card" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <p className="eyebrow">Payment Link</p><h2>Demo Payment</h2>
      <label htmlFor="checkoutWebsite">Website</label><select id="checkoutWebsite" value={form.websiteId} onChange={(event) => update('websiteId', event.target.value)} required>{websites.length ? websites.map((site) => <option key={site.id} value={site.id}>{site.domain} ({site.subscriptionStatus})</option>) : <option value="">Add a website first</option>}</select>
      <label htmlFor="orderId">Order ID</label><input id="orderId" value={form.orderId} onChange={(event) => update('orderId', event.target.value)} required />
      <label htmlFor="sellerName">Seller name</label><input id="sellerName" value={form.sellerName} onChange={(event) => update('sellerName', event.target.value)} placeholder="Merchant or seller name" />
      <label htmlFor="buyerName">Buyer name</label><input id="buyerName" value={form.buyerName} onChange={(event) => update('buyerName', event.target.value)} placeholder="Customer name" />
      <label htmlFor="buyerAddress">Buyer address</label><input id="buyerAddress" value={form.buyerAddress} onChange={(event) => update('buyerAddress', event.target.value)} placeholder="Customer address" />
      <label htmlFor="amount">Amount</label><input id="amount" type="number" min="1" step="0.01" value={form.amount} onChange={(event) => update('amount', event.target.value)} required />
      <label htmlFor="transactionId">Transaction ID</label><input id="transactionId" value={form.transactionId} placeholder="Customer TrxID" onChange={(event) => update('transactionId', event.target.value)} required />
      <label htmlFor="returnUrl">Return URL</label><input id="returnUrl" value={form.returnUrl} placeholder="https://shop.com/order-return" onChange={(event) => update('returnUrl', event.target.value)} />
      <button type="submit">Verify Payment</button><Message text={message} />
    </form>
  );
}
function WebsiteList({ websites, onRenew }) {
  return (
    <section className="panel website-panel"><div className="section-title compact-title"><div><p className="eyebrow">My Plan</p><h2>Your Brands</h2></div><span className="pill">SMS auto approval</span></div>
      {!websites.length ? <div className="empty-state">No websites yet. Add your first domain above.</div> : <div className="website-list">{websites.map((site) => <WebsiteCard key={site.id} site={site} onRenew={onRenew} />)}</div>}
    </section>
  );
}

function WebsiteCard({ site, onRenew }) {
  const [transactionId, setTransactionId] = useState('');
  const [message, setMessage] = useState('');
  const appDownloadUrl = absoluteDownloadUrl(site.appDownloadUrl);
  const unlocked = Boolean(site.androidAppEnabled || site.brandStatus === 'active');
  const actionLabel = unlocked ? 'Renew' : 'Activate';
  async function submit(event) {
    event.preventDefault();
    setMessage(`Checking ${formatMoney(site.monthlyFee || site.brandCharge || 60)} admin payment...`);
    const resultMessage = await onRenew(site, transactionId.trim());
    setMessage(resultMessage);
    if (/activated|applied|renewed|ready/i.test(resultMessage)) setTransactionId('');
  }
  return (
    <article className="website-card">
      <div className="website-card-top"><div><h3>{site.name || site.domain}</h3><p className="subtle">{site.domain}</p></div><span className={`badge ${unlocked ? 'active' : ''}`}>{formatBrandStatus(site.brandStatus)}</span></div>
      <div className="brand-detail-grid">
        <div><span>Receiver</span><strong>{site.walletProvider ? `${site.walletProvider} ${site.walletNumber}` : 'Not set'}</strong></div>
        <div><span>Charge</span><strong>{formatMoney(site.brandCharge || site.monthlyFee)}</strong></div>
        <div><span>Payment</span><strong>{site.paymentStatus || 'unpaid'}</strong></div>
      </div>
      {unlocked ? <div className="api-key-line"><code>{site.apiKey}</code><button type="button" className="ghost-button small" onClick={() => copyText(site.apiKey)}>Copy</button></div> : <div className="empty-state compact-empty">API key unlocks automatically when admin SMS TrxID and amount match.</div>}
      <div className="website-meta"><span>Paid until</span><strong>{site.paidUntil ? formatDate(site.paidUntil) : 'Not active'}</strong></div>
      {appDownloadUrl && unlocked ? <a className="ghost-button download-link" href={appDownloadUrl} download>Download Android App</a> : null}
      {site.adminNote ? <p className="message">{site.adminNote}</p> : null}
      <form className="renew-form" onSubmit={submit}><input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder={`${formatMoney(site.monthlyFee || site.brandCharge || 60)} admin payment TrxID`} required /><button type="submit">{actionLabel}</button><Message text={message} /></form>
    </article>
  );
}

function AndroidCard({ client, response, devices = [], websites = [] }) {
  const lastDevice = devices[0];
  const unlockedBrand = websites.find((site) => site.androidAppEnabled || site.brandStatus === 'active');
  const downloadUrl = absoluteDownloadUrl(unlockedBrand?.appDownloadUrl);
  return (
    <section className="panel android-card"><p className="eyebrow">Android App</p><h2>SMS forwarding device</h2><p>{unlockedBrand ? `Brand ${unlockedBrand.name || unlockedBrand.domain} is active. Download the app and login with your client account.` : 'Open a brand first. Android app download unlocks after admin SMS payment matching.'}</p>{downloadUrl ? <a className="ghost-button download-link" href={downloadUrl} download>Download Android App</a> : <div className="empty-state compact-empty">No active brand yet. Submit the admin payment TrxID for SMS matching.</div>}<div className="device-preview"><span className="notch" /><strong>{lastDevice?.name || client?.email || 'client@example.com'}</strong><small>{lastDevice ? `Last seen ${formatDate(lastDevice.lastSeenAt)}` : 'Waiting for device login'}</small></div><pre>{JSON.stringify(response, null, 2)}</pre></section>
  );
}

function TransactionTable({ items = [] }) {
  if (!items.length) return <div className="empty-state">No merchant payment history yet. Verify a payment from Payment Link; it will stay pending until SMS matches or admin approves.</div>;
  return <div className="table-wrap"><table><thead><tr><th>#</th><th>Domain</th><th>TrxID</th><th>Order</th><th>Amount</th><th>Status</th></tr></thead><tbody>{items.map((item, index) => <tr key={item.id || item.transaction_id}><td>{index + 1}</td><td>{item.domain || '-'}</td><td><strong>{item.transaction_id}</strong><small>{item.buyerName || item.sellerName || ''}</small></td><td>{item.order_id || '-'}</td><td>{formatMoney(item.amount)}</td><td><span className={`status-chip ${transactionStatusClass(item.status)}`}>{formatBrandStatus(item.status || 'verified')}</span><small>{item.adminNote || ''}</small></td></tr>)}</tbody></table></div>;
}

function PaymentDataTable({ items = [] }) {
  if (!items.length) return <div className="empty-state">No Android SMS data yet. Login in the Android app and scan inbox.</div>;
  return <div className="table-wrap"><table><thead><tr><th>#</th><th>Provider</th><th>TrxID</th><th>Amount</th><th>Status</th><th>Received</th></tr></thead><tbody>{items.map((item, index) => <tr key={item.id || item.transaction_id}><td>{index + 1}</td><td>{item.provider || item.sender}</td><td><strong>{item.transaction_id}</strong></td><td>{formatMoney(item.amount)}</td><td><span className={`status-chip ${item.status === 'verified' ? 'success' : 'pending'}`}>{item.status}</span></td><td>{formatDate(item.receivedAt || item.createdAt)}</td></tr>)}</tbody></table></div>;
}

function InvoiceTable({ items = [] }) {
  if (!items.length) return <div className="empty-state">No unpaid invoices. Your websites are active.</div>;
  return <div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Title</th><th>Amount</th><th>Status</th><th>Due</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.id}</strong></td><td>{item.title}</td><td>{formatMoney(item.amount)}</td><td><span className="status-chip pending">{item.status}</span></td><td>{formatDate(item.dueDate)}</td></tr>)}</tbody></table></div>;
}

function DeviceList({ devices = [] }) {
  return (
    <section className="panel">
      <div className="section-title"><div><p className="eyebrow">Devices</p><h2>Connected Android apps</h2></div><span className="pill">{devices.length} devices</span></div>
      {!devices.length ? <div className="empty-state">No device has registered yet. Login from the Android app once.</div> : <div className="card-list">{devices.map((device) => <article className="route-card" key={device.id || device.deviceId}><h3>{device.name}</h3><p>{device.manufacturer} {device.model}</p><span className="badge active">{device.status}</span><small>Last seen {formatDate(device.lastSeenAt)} · SMS sent {device.totalSms}</small></article>)}</div>}
    </section>
  );
}

function SettingsForm({ title, settings, onSave, compact = false }) {
  const [form, setForm] = useState(() => ({ ...defaultSettings, ...settings, paymentMethodsText: (settings.paymentMethods || defaultSettings.paymentMethods).join(', ') }));
  useEffect(() => { setForm({ ...defaultSettings, ...settings, paymentMethodsText: (settings.paymentMethods || defaultSettings.paymentMethods).join(', ') }); }, [settings]);
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event) {
    event.preventDefault();
    await onSave({ ...form, paymentMethods: form.paymentMethodsText.split(',').map((item) => item.trim()).filter(Boolean) });
  }
  return (
    <form className="panel form-card settings-form" onSubmit={submit}>
      <p className="eyebrow">{compact ? 'Currency' : 'Settings'}</p><h2>{title}</h2>
      <label htmlFor="currency">Currency</label><input id="currency" value={form.currency} onChange={(event) => update('currency', event.target.value)} required />
      {!compact ? <><label htmlFor="timezone">Timezone</label><input id="timezone" value={form.timezone} onChange={(event) => update('timezone', event.target.value)} /><label htmlFor="webhookUrl">Webhook URL</label><input id="webhookUrl" value={form.webhookUrl} onChange={(event) => update('webhookUrl', event.target.value)} placeholder="https://example.com/webhook" /><label htmlFor="successUrl">Success URL</label><input id="successUrl" value={form.successUrl} onChange={(event) => update('successUrl', event.target.value)} /><label htmlFor="cancelUrl">Cancel URL</label><input id="cancelUrl" value={form.cancelUrl} onChange={(event) => update('cancelUrl', event.target.value)} /><label htmlFor="paymentMethods">Payment methods</label><input id="paymentMethods" value={form.paymentMethodsText} onChange={(event) => update('paymentMethodsText', event.target.value)} /><label htmlFor="supportEmail">Support email</label><input id="supportEmail" type="email" value={form.supportEmail} onChange={(event) => update('supportEmail', event.target.value)} /></> : null}
      <button type="submit">Save {compact ? 'Currency' : 'Settings'}</button>
    </form>
  );
}

function SupportForm({ onCreateTicket }) {
  const [form, setForm] = useState({ subject: '', category: 'General', priority: 'normal', message: '' });
  async function submit(event) { event.preventDefault(); const ok = await onCreateTicket(form); if (ok) setForm({ subject: '', category: 'General', priority: 'normal', message: '' }); }
  return (
    <form className="panel form-card" onSubmit={submit}>
      <p className="eyebrow">Support</p><h2>Create Ticket</h2>
      <label htmlFor="ticketSubject">Subject</label><input id="ticketSubject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required />
      <label htmlFor="ticketCategory">Category</label><input id="ticketCategory" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
      <label htmlFor="ticketMessage">Message</label><input id="ticketMessage" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required />
      <button type="submit">Send Ticket</button>
    </form>
  );
}

function TicketList({ tickets = [] }) {
  return <section className="panel"><div className="section-title"><div><p className="eyebrow">Tickets</p><h2>Support history</h2></div><span className="pill">{tickets.length} total</span></div>{!tickets.length ? <div className="empty-state">No support tickets yet.</div> : <div className="card-list">{tickets.map((ticket) => <article className="route-card" key={ticket.id}><h3>{ticket.subject}</h3><p>{ticket.message}</p><span className="badge">{ticket.status}</span><small>{ticket.category} · {formatDate(ticket.createdAt)}</small></article>)}</div>}</section>;
}

function PlansGrid({ plans = [] }) {
  return <section className="pricing-grid portal-pricing">{plans.map((plan) => <article className="price-card" key={plan.id}><div className="price-icon" /><h3>{plan.name}</h3><p>{plan.duration}</p><strong>{formatMoney(plan.price)}</strong><ul><li>{plan.websites === -1 ? 'Unlimited Websites' : `${plan.websites} Websites`}</li><li>Unlimited Transactions</li><li>Android SMS Forwarding</li><li>Free Support</li></ul></article>)}</section>;
}

function RenewalList({ renewals = [] }) {
  return <section className="panel"><div className="section-title"><div><p className="eyebrow">Renewals</p><h2>Subscription history</h2></div><span className="pill">{renewals.length} records</span></div>{!renewals.length ? <div className="empty-state">No renewals yet.</div> : <div className="table-wrap"><table><thead><tr><th>TrxID</th><th>Amount</th><th>Paid</th><th>Valid Until</th></tr></thead><tbody>{renewals.map((item) => <tr key={item.id}><td><strong>{item.transaction_id}</strong></td><td>{formatMoney(item.amount)}</td><td>{formatDate(item.paidAt)}</td><td>{formatDate(item.paidUntil)}</td></tr>)}</tbody></table></div>}</section>;
}

function DocsList({ docs = [] }) {
  return <section className="panel"><div className="section-title"><div><p className="eyebrow">Developer Docs</p><h2>Integration checklist</h2></div><span className="pill">{docs.length} items</span></div><div className="card-list">{docs.map((doc) => <article className="route-card" key={doc.title}><h3>{doc.title}</h3><p><strong>{doc.method}</strong> secure server route</p><small>{doc.auth}</small><code>{doc.body.join(', ') || 'No body'}</code></article>)}</div></section>;
}

function ApiKeyList({ websites = [] }) {
  const activeWebsites = websites.filter((site) => site.androidAppEnabled || site.brandStatus === 'active');
  if (!activeWebsites.length) return <div className="empty-state">Open a brand with a matching admin payment TrxID to unlock API keys.</div>;
  return <div className="website-list">{activeWebsites.map((site) => <div className="api-key-line" key={site.id}><code>{site.apiKey}</code><button type="button" className="ghost-button small" onClick={() => copyText(site.apiKey)}>Copy</button></div>)}</div>;
}

function InfoPanel({ eyebrow, title, text, items = [] }) {
  return <section className="panel info-panel"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{text}</p><div className="card-list">{items.map((item) => <div className="route-card compact" key={item}>{item}</div>)}</div></section>;
}

function SectionIntro({ eyebrow, title, text }) { return <div className="section-intro"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{text}</p></div>; }
function FeatureCard({ index, title, text }) { return <article className="feature-card"><span className={`feature-icon icon-${index}`} /><h3>{title}</h3><p>{text}</p></article>; }
function StepCard({ num, title, text }) { return <article className="step-card"><span className="step-number">{num}</span><div className="step-art" /><h3>{title}</h3><p>{text}</p></article>; }
function Metric({ value, label }) { return <article className="metric-card"><strong>{value}</strong><span>{label}</span></article>; }
function TagCloud({ title, tags }) { return <div className="tag-block"><h3>{title}</h3><div className="tag-cloud">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>; }
function UpdateCard({ label, title, text }) { return <article className="update-card"><span>{label}</span><h3>{title}</h3><p>{text}</p></article>; }
function LineBurst() { return <div className="line-burst" aria-hidden="true">{Array.from({ length: 9 }).map((_, index) => <span key={index} />)}</div>; }

function Message({ text }) {
  if (!text) return <p className="message" />;
  const safeText = textMessage(text);
  const isError = /failed|required|invalid|not found|due|error|redeploy/i.test(safeText);
  return <p className={`message ${isError ? 'error' : 'success'}`}>{safeText}</p>;
}

function errorMessage(data, fallback) { return textMessage(data?.error || data?.message || fallback); }
function paymentVerificationMessage(data) {
  if (data?.status === 'pending_sms') return data.message || 'Payment saved. Waiting for matching Android SMS.';
  if (data?.status === 'already_verified') return 'Payment already verified.';
  if (data?.status === 'manual_accepted') return 'Payment manually accepted.';
  return 'Payment verified.';
}
function resolveApiBaseUrl(value) {
  let configured = String(value || '').trim();
  const assignmentMatch = configured.match(/^VITE_PAYMENT_GATEWAY_API_URL\s*=\s*(.+)$/);
  if (assignmentMatch) configured = assignmentMatch[1].trim();
  configured = configured.replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (/^https?:\/\//i.test(configured)) return configured;
  if (configured && configured.startsWith('/')) return configured;
  if (configured) return FALLBACK_GATEWAY_API_URL;
  return window.location.origin.replace(/\/+$/, '');
}
function normalizePortalData(data) {
  return {
    ...emptyPortalData,
    ...(data || {}),
    summary: { ...emptyPortalData.summary, ...(data?.summary || {}) },
    settings: { ...defaultSettings, ...(data?.settings || {}) },
    websites: data?.websites || [],
    adminPayment: { ...emptyPortalData.adminPayment, ...(data?.adminPayment || {}) },
    appDownload: { ...emptyPortalData.appDownload, ...(data?.appDownload || {}) },
    payments: data?.payments || [],
    transactions: data?.transactions || [],
    merchantHistory: data?.merchantHistory || data?.transactions || [],
    renewals: data?.renewals || [],
    billingRequests: data?.billingRequests || [],
    invoices: data?.invoices || [],
    devices: data?.devices || [],
    tickets: data?.tickets || [],
    plans: data?.plans || [],
    docs: data?.docs || []
  };
}
function normalizeAdminData(data) {
  return {
    ...emptyAdminData,
    ...(data || {}),
    summary: { ...emptyAdminData.summary, ...(data?.summary || {}) },
    config: { ...emptyAdminData.config, ...(data?.config || {}) },
    clients: data?.clients || [],
    brands: data?.brands || [],
    billingRequests: data?.billingRequests || [],
    payments: data?.payments || [],
    accountHistory: data?.accountHistory || [],
    merchantVerifications: data?.merchantVerifications || [],
    devices: data?.devices || [],
    tickets: data?.tickets || []
  };
}
function isPendingBrand(brand) {
  return ['pending_payment', 'pending_review'].includes(brand?.brandStatus);
}
function isPendingBilling(request) {
  return ['pending', 'pending_review'].includes(request?.status);
}
function isPendingMerchantVerification(request) {
  return request?.status === 'pending_sms';
}
function searchMatches(item, fields, query) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => String(item?.[field] || '').toLowerCase().includes(needle));
}
function statusBadgeClass(status) {
  const value = String(status || '').toLowerCase();
  if (['active', 'approved', 'verified', 'manual_approved', 'manual_accepted', 'paid', 'online', 'open'].includes(value)) return 'active';
  if (['rejected', 'blocked', 'suspended', 'failed', 'refunded', 'closed', 'offline'].includes(value)) return 'danger';
  return '';
}
function transactionStatusClass(status) {
  const value = String(status || '').toLowerCase();
  if (['verified', 'manual_approved', 'manual_accepted', 'already_verified'].includes(value)) return 'success';
  if (['rejected', 'failed'].includes(value)) return 'danger';
  return 'pending';
}
function textMessage(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value.message === 'string') return value.message;
  if (typeof value.code === 'string') return value.code;
  try { return JSON.stringify(value); } catch { return 'Unexpected response from server'; }
}
async function copyText(text) { try { await navigator.clipboard.writeText(text); } catch { window.prompt('Copy this value', text); } }
function formatMoney(value) { return `Tk ${Number(value || 0).toFixed(2)}`; }
function absoluteDownloadUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}
function formatBrandStatus(value) {
  return String(value || 'pending_payment').replaceAll('_', ' ');
}
function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

createRoot(document.getElementById('root')).render(<App />);
