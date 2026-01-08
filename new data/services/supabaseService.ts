
import { createClient } from '@supabase/supabase-js';
import { CompanyInfo } from '../types';

const supabaseUrl = 'https://tbluygtqhlydhgdddgou.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRibHV5Z3RxaGx5ZGhnZGRkZ291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjAzMDgsImV4cCI6MjA4MzQzNjMwOH0.Cjt_5qHu0ShNRh6yZidDTHKUAcFzFsKf-nu32b6mrWE';

// Initialize client with the provided credentials
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseService {
  async saveExtractions(data: CompanyInfo[]) {
    if (!supabase) {
      console.warn("Supabase client not initialized.");
      return { error: "No Supabase configuration" };
    }

    // Map frontend camelCase to database snake_case for the 'company_extractions' table
    const records = data.map(item => ({
      company_name: item.companyName,
      official_website: item.officialWebsite,
      email1: item.email1,
      email2: item.email2,
      industry: item.industry,
      location: item.location,
      linkedin: item.linkedin,
      phone: item.phone,
      founded_year: item.foundedYear,
      company_size: item.companySize,
      sources: item.sources,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('company_extractions')
      .upsert(records, { onConflict: 'official_website' });

    if (error) {
      console.error("Supabase Save Error:", error);
      throw error;
    }

    return { success: true };
  }
}
