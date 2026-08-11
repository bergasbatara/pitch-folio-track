import { expect, type BrowserContext, type Page } from '@playwright/test';

export const API_URL = 'http://localhost:3000';

type CompanyRef = { id: string };

type TaxCodeRef = {
  id: string;
  code: string;
  name: string;
  rate: number;
};

type JournalLineRef = {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  account: {
    id: string;
    code: string;
    name: string;
    type: string;
    normalBalance: string;
  };
};

type JournalEntryRef = {
  id: string;
  date: string;
  memo: string | null;
  source: string | null;
  sourceId: string | null;
  status: string;
  lines: JournalLineRef[];
};

type SaleRef = {
  id: string;
  soldAt: string;
  productId: string;
  productCode: string | null;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  subtotalAmount: number;
  taxCodeId: string | null;
  taxCodeName: string | null;
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
  settlementType: 'cash' | 'receivable';
  status: string;
};

type PurchaseRef = {
  id: string;
  date: string;
  itemName: string;
  productId: string | null;
  productCode: string | null;
  productName: string | null;
  supplier: string | null;
  quantity: number;
  unitCost: number;
  subtotalCost: number;
  taxCodeId: string | null;
  taxCodeName: string | null;
  taxRate: number;
  taxAmount: number;
  totalCost: number;
  settlementType: 'cash' | 'payable';
  status: string;
};

type ReceivableRef = {
  id: string;
  companyId: string;
  description: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
};

type PayableRef = {
  id: string;
  companyId: string;
  description: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
};

type RangeReport = {
  from: string;
  to: string;
  totals: {
    revenue: number;
    expense: number;
    netProfit: number;
    cashIn: number;
    cashOut: number;
    netCash: number;
    receivableChange: number;
    payableChange: number;
    inventoryValue: number;
  };
  byType: Record<string, number>;
  accounts: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    normalBalance: string;
    debit: number;
    credit: number;
    net: number;
  }>;
};

type BalanceReport = {
  asOf: string;
  byType: Record<string, number>;
  accounts: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    normalBalance: string;
    debit: number;
    credit: number;
    net: number;
  }>;
  categories: {
    cash: number;
    receivable: number;
    inventory: number;
    prepaid: number;
    prepaidTax: number;
    otherCurrentAssets: number;
    fixedAssetsGross: number;
    accumulatedDepreciation: number;
    fixedAssetsNet: number;
    payables: number;
    bankDebtShort: number;
    otherCurrentLiabilities: number;
    bankDebtLong: number;
    financingDebt: number;
    equityCapital: number;
    retainedEarnings: number;
    totalCurrentAssets: number;
    totalNonCurrentAssets: number;
    totalAssets: number;
    totalCurrentLiabilities: number;
    totalLongTermLiabilities: number;
    totalLiabilities: number;
    totalEquity: number;
  };
};

const uniqueEmail = () => `pw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;

export async function registerAndCompleteOnboarding(page: Page) {
  const email = uniqueEmail();
  const password = 'Password123!';

  const response = await page.context().request.post(`${API_URL}/auth/register`, {
    data: {
      email,
      password,
      name: 'Playwright User',
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();

  const browser = page.context().browser();
  if (!browser) {
    throw new Error('Expected a browser-backed Playwright context');
  }

  const storageState = await page.context().request.storageState();
  const context = await browser.newContext({ storageState });
  const authedPage = await context.newPage();
  const meResponse = await context.request.get(`${API_URL}/auth/me`);
  expect(meResponse.ok(), await meResponse.text()).toBeTruthy();

  await authedPage.goto('/onboarding/welcome');
  await expect(authedPage).toHaveURL(/\/onboarding\/welcome$/);
  await authedPage.getByRole('button', { name: /Atur Profil Perusahaan/i }).click();
  await expect(authedPage).toHaveURL(/\/onboarding\/company-setup$/);

  await authedPage.getByLabel(/Nama Perusahaan/i).fill('Playwright Test Company');
  await authedPage.getByLabel(/Alamat Bisnis/i).fill('123 Test Street');
  await authedPage.getByLabel(/Nomor Telepon/i).fill('08123456789');
  await authedPage.getByLabel(/Email Bisnis/i).fill(email);
  await authedPage.getByRole('button', { name: /Selesaikan Pengaturan/i }).click();

  await expect(authedPage).toHaveURL(/\/$/);

  return { email, password, page: authedPage, context };
}

export async function subscribeToPlan(
  page: Page,
  planId: 'business' | 'professional' | 'premium',
) {
  const csrfResponse = await page.context().request.get(`${API_URL}/auth/csrf`);
  expect(csrfResponse.ok(), await csrfResponse.text()).toBeTruthy();

  const company = await getCurrentCompany(page);
  const csrfToken = await getCsrfToken(page);

  const response = await page.context().request.post(
    `${API_URL}/companies/${company.id}/subscription`,
    {
      data: { planId },
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
    },
  );

  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function subscribeCompanyToPlan(
  page: Page,
  companyId: string,
  planId: 'business' | 'professional' | 'premium',
) {
  const csrfResponse = await page.context().request.get(`${API_URL}/auth/csrf`);
  expect(csrfResponse.ok(), await csrfResponse.text()).toBeTruthy();

  const csrfToken = await getCsrfToken(page);

  const response = await page.context().request.post(
    `${API_URL}/companies/${companyId}/subscription`,
    {
      data: { planId },
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
    },
  );

  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function expireCurrentSubscription(page: Page) {
  const csrfResponse = await page.context().request.get(`${API_URL}/auth/csrf`);
  expect(csrfResponse.ok(), await csrfResponse.text()).toBeTruthy();

  const company = await getCurrentCompany(page);
  const csrfToken = await getCsrfToken(page);

  const response = await page.context().request.patch(
    `${API_URL}/companies/${company.id}/subscription`,
    {
      data: { status: 'expired' },
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
    },
  );

  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function createAdditionalCompany(
  page: Page,
  data: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId?: string;
    currency?: string;
  },
) {
  const csrfResponse = await page.context().request.get(`${API_URL}/auth/csrf`);
  expect(csrfResponse.ok(), await csrfResponse.text()).toBeTruthy();

  const csrfToken = await getCsrfToken(page);

  const response = await page.context().request.post(`${API_URL}/companies`, {
    data,
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
  });

  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json() as Promise<{ id: string; name: string }>;
}

export async function forceLogoutCurrentSession(page: Page) {
  const csrfResponse = await page.context().request.get(`${API_URL}/auth/csrf`);
  expect(csrfResponse.ok(), await csrfResponse.text()).toBeTruthy();

  const csrfToken = await getCsrfToken(page);

  const response = await page.context().request.post(`${API_URL}/auth/logout`, {
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
  });

  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function updateCurrentCompanyProfile(
  page: Page,
  data: { name: string; phone: string; address: string; taxId?: string },
) {
  const csrfResponse = await page.context().request.get(`${API_URL}/auth/csrf`);
  expect(csrfResponse.ok(), await csrfResponse.text()).toBeTruthy();

  const company = await getCurrentCompany(page);
  const csrfToken = await getCsrfToken(page);

  const response = await page.context().request.patch(`${API_URL}/companies/${company.id}`, {
    data,
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
  });

  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function createJournalEntryByCode(
  page: Page,
  input: {
    date: string;
    memo: string;
    lines: Array<{ accountCode: string; debit: number; credit: number }>;
  },
) {
  const csrfResponse = await page.context().request.get(`${API_URL}/auth/csrf`);
  expect(csrfResponse.ok(), await csrfResponse.text()).toBeTruthy();

  const company = await getCurrentCompany(page);
  const csrfToken = await getCsrfToken(page);

  const accountsResponse = await page.context().request.get(`${API_URL}/companies/${company.id}/accounts`);
  expect(accountsResponse.ok(), await accountsResponse.text()).toBeTruthy();
  const accounts = (await accountsResponse.json()) as Array<{ id: string; code: string }>;
  const accountByCode = new Map(accounts.map((account) => [account.code, account.id]));

  const lines = input.lines.map((line) => {
    const accountId = accountByCode.get(line.accountCode);
    if (!accountId) {
      throw new Error(`Account code not found: ${line.accountCode}`);
    }
    return {
      accountId,
      debit: line.debit,
      credit: line.credit,
    };
  });

  const response = await page.context().request.post(`${API_URL}/companies/${company.id}/journals`, {
    data: {
      date: input.date,
      memo: input.memo,
      status: 'posted',
      lines,
    },
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
  });

  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function createProduct(
  page: Page,
  input: {
    name: string;
    code?: string;
    type?: string;
    unit?: string;
    price: number;
    buyPrice?: number;
    stock: number;
  },
) {
  const csrfResponse = await page.context().request.get(`${API_URL}/auth/csrf`);
  expect(csrfResponse.ok(), await csrfResponse.text()).toBeTruthy();

  const company = await getCurrentCompany(page);
  const csrfToken = await getCsrfToken(page);

  const response = await page.context().request.post(`${API_URL}/companies/${company.id}/products`, {
    data: input,
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
  });

  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json() as Promise<{ id: string; name: string; code?: string | null }>;
}

export async function createProductForCompany(
  page: Page,
  companyId: string,
  input: {
    name: string;
    code?: string;
    type?: string;
    unit?: string;
    price: number;
    buyPrice?: number;
    stock: number;
  },
) {
  const csrfResponse = await page.context().request.get(`${API_URL}/auth/csrf`);
  expect(csrfResponse.ok(), await csrfResponse.text()).toBeTruthy();

  const csrfToken = await getCsrfToken(page);

  const response = await page.context().request.post(`${API_URL}/companies/${companyId}/products`, {
    data: input,
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
  });

  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json() as Promise<{ id: string; name: string; code?: string | null }>;
}

export async function createPurchase(
  page: Page,
  input: {
    date: string;
    itemName: string;
    productId?: string;
    productCode?: string;
    supplier?: string;
    quantity: number;
    unitCost: number;
    notes?: string;
    taxCodeId?: string | null;
    settlementType?: 'cash' | 'payable';
  },
) {
  const csrfResponse = await page.context().request.get(`${API_URL}/auth/csrf`);
  expect(csrfResponse.ok(), await csrfResponse.text()).toBeTruthy();

  const company = await getCurrentCompany(page);
  const csrfToken = await getCsrfToken(page);

  const response = await page.context().request.post(`${API_URL}/companies/${company.id}/purchases`, {
    data: input,
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
  });

  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json() as Promise<PurchaseRef>;
}

export async function createSale(
  page: Page,
  input: {
    soldAt: string;
    productId?: string;
    productCode?: string;
    quantity: number;
    pricePerUnit: number;
    taxCodeId?: string | null;
    settlementType?: 'cash' | 'receivable';
  },
) {
  const csrfResponse = await page.context().request.get(`${API_URL}/auth/csrf`);
  expect(csrfResponse.ok(), await csrfResponse.text()).toBeTruthy();

  const company = await getCurrentCompany(page);
  const csrfToken = await getCsrfToken(page);

  const response = await page.context().request.post(`${API_URL}/companies/${company.id}/sales`, {
    data: input,
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
  });

  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json() as Promise<SaleRef>;
}

export async function listTaxCodes(page: Page, companyId?: string) {
  const company = companyId ? { id: companyId } : await getCurrentCompany(page);
  const response = await page.context().request.get(`${API_URL}/companies/${company.id}/tax-codes`);
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json() as Promise<TaxCodeRef[]>;
}

export async function listJournals(page: Page, companyId?: string) {
  const company = companyId ? { id: companyId } : await getCurrentCompany(page);
  const response = await page.context().request.get(`${API_URL}/companies/${company.id}/journals`);
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json() as Promise<JournalEntryRef[]>;
}

export async function listReceivables(page: Page, companyId?: string) {
  const company = companyId ? { id: companyId } : await getCurrentCompany(page);
  const response = await page.context().request.get(`${API_URL}/companies/${company.id}/receivables`);
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json() as Promise<ReceivableRef[]>;
}

export async function listPayables(page: Page, companyId?: string) {
  const company = companyId ? { id: companyId } : await getCurrentCompany(page);
  const response = await page.context().request.get(`${API_URL}/companies/${company.id}/payables`);
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json() as Promise<PayableRef[]>;
}

export async function getRangeReport(page: Page, from: string, to: string, companyId?: string) {
  const company = companyId ? { id: companyId } : await getCurrentCompany(page);
  const response = await page.context().request.get(
    `${API_URL}/companies/${company.id}/reports/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json() as Promise<RangeReport>;
}

export async function getBalanceReport(page: Page, asOf: string, companyId?: string) {
  const company = companyId ? { id: companyId } : await getCurrentCompany(page);
  const response = await page.context().request.get(
    `${API_URL}/companies/${company.id}/reports/balance?asOf=${encodeURIComponent(asOf)}`,
  );
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json() as Promise<BalanceReport>;
}

export async function getCurrentCompany(page: Page) {
  const companyResponse = await page.context().request.get(`${API_URL}/companies/current`);
  expect(companyResponse.ok(), await companyResponse.text()).toBeTruthy();
  return (await companyResponse.json()) as CompanyRef;
}

async function getCsrfToken(page: Page) {
  const cookies = await page.context().cookies(API_URL);
  return cookies.find((cookie) => cookie.name === 'csrf_token')?.value;
}

export async function closeAuthedContext(context: BrowserContext) {
  await context.close();
}
