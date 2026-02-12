import { useEffect, useState } from 'react';
import { CompanyProfile } from '../types';

const DEFAULT_COMPANY: CompanyProfile = {
  id: '',
  name: '',
  address: '',
  phone: '',
  email: '',
  taxId: '',
  currency: 'IDR',
  categories: ['Electronics', 'Food & Beverage', 'Clothing', 'Other'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function useCompanyProfile() {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
  const ACCESS_TOKEN_KEY = 'auth_access_token';

  useEffect(() => {
    const init = async () => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        setIsLoading(false);
        return;
      }
      try {
        const fetched = await fetchJson<CompanyProfile>('/companies/current', {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setCompany(hydrateCompany(fetched));
      } catch {
        setCompany(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const saveCompanyProfile = async (profile: Partial<CompanyProfile>) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      throw new Error('Missing access token');
    }
    if (company?.id) {
      const updated = await fetchJson<CompanyProfile>(`/companies/${company.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(profile),
      });
      const hydrated = hydrateCompany(updated);
      setCompany(hydrated);
      return hydrated;
    }
    const created = await fetchJson<CompanyProfile>('/companies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(profile),
    });
    const hydrated = hydrateCompany(created);
    setCompany(hydrated);
    return hydrated;
  };

  const isProfileComplete = (): boolean => {
    if (!company) return false;
    return !!(company.name && company.address && company.phone && company.email);
  };

  const hydrateCompany = (data: CompanyProfile) => {
    return {
      ...DEFAULT_COMPANY,
      ...data,
      categories: data.categories ?? DEFAULT_COMPANY.categories,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  };

  const fetchJson = async <T,>(path: string, options: RequestInit): Promise<T> => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    };
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
    if (!response.ok) {
      let message = 'Request failed';
      try {
        const body = await response.json();
        message = body.message ?? message;
      } catch {
        // ignore parsing errors
      }
      throw new Error(message);
    }
    return response.json() as Promise<T>;
  };

  return {
    company,
    saveCompanyProfile,
    isProfileComplete,
    isLoading,
  };
}
