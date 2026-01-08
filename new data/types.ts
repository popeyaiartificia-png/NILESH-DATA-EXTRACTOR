
export enum OutputMode {
  FULL_DETAILS = 'FULL_DETAILS',
  ONLY_EMAILS = 'ONLY_EMAILS',
  CUSTOM = 'CUSTOM'
}

export interface CompanyInfo {
  companyName: string;
  officialWebsite: string;
  email1: string;
  email2: string;
  industry: string;
  location: string;
  linkedin: string;
  phone: string;
  foundedYear: string;
  companySize: string;
  sources?: string[];
}

export interface CompanyField {
  id: keyof CompanyInfo;
  label: string;
}

export const AVAILABLE_FIELDS: CompanyField[] = [
  { id: 'companyName', label: 'Company Name' },
  { id: 'officialWebsite', label: 'Official Website' },
  { id: 'email1', label: 'Email ID 1' },
  { id: 'email2', label: 'Email ID 2' },
  { id: 'industry', label: 'Industry' },
  { id: 'location', label: 'Location' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'phone', label: 'Phone / Contact' },
  { id: 'foundedYear', label: 'Founded Year' },
  { id: 'companySize', label: 'Company Size' },
];

export interface ProcessedEntry {
  input: string;
  result: CompanyInfo | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}
