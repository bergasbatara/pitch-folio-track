import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
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
  const [company, setCompany] = useLocalStorage<CompanyProfile | null>('company-profile', null);

  const saveCompanyProfile = (profile: Partial<CompanyProfile>) => {
    const updatedProfile: CompanyProfile = {
      ...DEFAULT_COMPANY,
      ...company,
      ...profile,
      id: company?.id || crypto.randomUUID(),
      updatedAt: new Date(),
      createdAt: company?.createdAt || new Date(),
    };
    setCompany(updatedProfile);
    return updatedProfile;
  };

  const isProfileComplete = (): boolean => {
    if (!company) return false;
    return !!(company.name && company.address && company.phone && company.email);
  };

  return {
    company,
    saveCompanyProfile,
    isProfileComplete,
  };
}
