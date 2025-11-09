import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROPERTIES_CSV = path.join(DATA_DIR, 'properties.csv');
const TENANTS_CSV = path.join(DATA_DIR, 'tenants.csv');
const LEADS_CSV = path.join(DATA_DIR, 'leads.csv');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize CSV files with headers if they don't exist
const initCSV = (filePath: string, headers: string[]) => {
  if (!fs.existsSync(filePath)) {
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers.map(h => ({ id: h, title: h }))
    });
    // Write empty file with headers
    csvWriter.writeRecords([]);
  }
};

// Initialize CSV files
initCSV(PROPERTIES_CSV, [
  'property_id', 'property_code', 'title', 'address', 'city', 'locality', 
  'rent', 'available_from', 'bedrooms', 'bathrooms', 'area_sqft', 
  'amenities', 'furnishing', 'status', 'owner_id', 'owner_name', 
  'owner_phone', 'description', 'photos', 'created_at', 'updated_at'
]);

initCSV(TENANTS_CSV, [
  'tenant_id', 'name', 'phone', 'whatsapp_number', 'email', 
  'city', 'localities', 'budget_min', 'budget_max', 
  'move_in_date', 'bedrooms', 'amenities', 'preferences', 
  'source', 'consent_timestamp', 'consent_scope', 'created_at', 'updated_at'
]);

initCSV(LEADS_CSV, [
  'lead_id', 'tenant_id', 'property_id', 'property_code', 
  'channel', 'call_recording_url', 'transcript', 'nlp_extracted', 
  'match_score', 'owner_notified', 'status', 'created_at', 'updated_at'
]);

// Helper function to read CSV file
async function readCSV<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    if (!fs.existsSync(filePath)) {
      resolve([]);
      return;
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Helper function to write CSV file
async function writeCSV<T extends Record<string, any>>(filePath: string, data: T[], headers: string[]): Promise<void> {
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers.map(h => ({ id: h, title: h }))
  });
  await csvWriter.writeRecords(data);
}

// Helper function to append to CSV
async function appendCSV<T extends Record<string, any>>(filePath: string, data: T, headers: string[]): Promise<void> {
  const existing = await readCSV<T>(filePath);
  existing.push(data);
  await writeCSV(filePath, existing, headers);
}

export const csvStorage = {
  // Properties
  async getProperties(filters?: { owner_id?: string; city?: string; status?: string }): Promise<any[]> {
    const properties = await readCSV<any>(PROPERTIES_CSV);
    let filtered = properties;
    
    if (filters?.owner_id) {
      filtered = filtered.filter(p => p.owner_id === filters.owner_id);
    }
    if (filters?.city) {
      filtered = filtered.filter(p => p.city?.toLowerCase() === filters.city?.toLowerCase());
    }
    if (filters?.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    
    return filtered;
  },

  async getPropertyById(propertyId: string): Promise<any | null> {
    const properties = await readCSV<any>(PROPERTIES_CSV);
    return properties.find(p => p.property_id === propertyId) || null;
  },

  async getPropertyByCode(propertyCode: string): Promise<any | null> {
    const properties = await readCSV<any>(PROPERTIES_CSV);
    return properties.find(p => p.property_code?.toLowerCase() === propertyCode?.toLowerCase()) || null;
  },

  async createProperty(propertyData: any): Promise<any> {
    const properties = await readCSV<any>(PROPERTIES_CSV);
    const propertyId = propertyData.property_id || `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newProperty = {
      property_id: propertyId,
      property_code: propertyData.property_code || '',
      title: propertyData.title || '',
      address: propertyData.address || '',
      city: propertyData.city || '',
      locality: propertyData.locality || '',
      rent: propertyData.rent || '',
      available_from: propertyData.available_from || '',
      bedrooms: propertyData.bedrooms || '',
      bathrooms: propertyData.bathrooms || '',
      area_sqft: propertyData.area_sqft || '',
      amenities: typeof propertyData.amenities === 'string' ? propertyData.amenities : (Array.isArray(propertyData.amenities) ? propertyData.amenities.join(', ') : ''),
      furnishing: propertyData.furnishing || '',
      status: propertyData.status || 'available',
      owner_id: propertyData.owner_id || '',
      owner_name: propertyData.owner_name || '',
      owner_phone: propertyData.owner_phone || '',
      description: propertyData.description || '',
      photos: typeof propertyData.photos === 'string' ? propertyData.photos : (Array.isArray(propertyData.photos) ? propertyData.photos.join(', ') : ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    properties.push(newProperty);
    await writeCSV(PROPERTIES_CSV, properties, [
      'property_id', 'property_code', 'title', 'address', 'city', 'locality', 
      'rent', 'available_from', 'bedrooms', 'bathrooms', 'area_sqft', 
      'amenities', 'furnishing', 'status', 'owner_id', 'owner_name', 
      'owner_phone', 'description', 'photos', 'created_at', 'updated_at'
    ]);
    
    return newProperty;
  },

  async updateProperty(propertyId: string, updates: any): Promise<any | null> {
    const properties = await readCSV<any>(PROPERTIES_CSV);
    const index = properties.findIndex(p => p.property_id === propertyId);
    if (index === -1) return null;
    
    properties[index] = {
      ...properties[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await writeCSV(PROPERTIES_CSV, properties, [
      'property_id', 'property_code', 'title', 'address', 'city', 'locality', 
      'rent', 'available_from', 'bedrooms', 'bathrooms', 'area_sqft', 
      'amenities', 'furnishing', 'status', 'owner_id', 'owner_name', 
      'owner_phone', 'description', 'photos', 'created_at', 'updated_at'
    ]);
    
    return properties[index];
  },

  async deleteProperty(propertyId: string): Promise<boolean> {
    const properties = await readCSV<any>(PROPERTIES_CSV);
    const filtered = properties.filter(p => p.property_id !== propertyId);
    await writeCSV(PROPERTIES_CSV, filtered, [
      'property_id', 'property_code', 'title', 'address', 'city', 'locality', 
      'rent', 'available_from', 'bedrooms', 'bathrooms', 'area_sqft', 
      'amenities', 'furnishing', 'status', 'owner_id', 'owner_name', 
      'owner_phone', 'description', 'photos', 'created_at', 'updated_at'
    ]);
    return true;
  },

  // Tenants
  async getTenants(filters?: { phone?: string; city?: string }): Promise<any[]> {
    const tenants = await readCSV<any>(TENANTS_CSV);
    let filtered = tenants;
    
    if (filters?.phone) {
      filtered = filtered.filter(t => t.phone === filters.phone || t.whatsapp_number === filters.phone);
    }
    if (filters?.city) {
      filtered = filtered.filter(t => t.city?.toLowerCase() === filters.city?.toLowerCase());
    }
    
    return filtered;
  },

  async getTenantById(tenantId: string): Promise<any | null> {
    const tenants = await readCSV<any>(TENANTS_CSV);
    return tenants.find(t => t.tenant_id === tenantId) || null;
  },

  async getTenantByPhone(phone: string): Promise<any | null> {
    const tenants = await readCSV<any>(TENANTS_CSV);
    return tenants.find(t => t.phone === phone || t.whatsapp_number === phone) || null;
  },

  async createTenant(tenantData: any): Promise<any> {
    const tenants = await readCSV<any>(TENANTS_CSV);
    const tenantId = tenantData.tenant_id || `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newTenant = {
      tenant_id: tenantId,
      name: tenantData.name || '',
      phone: tenantData.phone || '',
      whatsapp_number: tenantData.whatsapp_number || tenantData.phone || '',
      email: tenantData.email || '',
      city: tenantData.city || '',
      localities: typeof tenantData.localities === 'string' ? tenantData.localities : (Array.isArray(tenantData.localities) ? tenantData.localities.join(', ') : ''),
      budget_min: tenantData.budget_min || '',
      budget_max: tenantData.budget_max || '',
      move_in_date: tenantData.move_in_date || '',
      bedrooms: tenantData.bedrooms || '',
      amenities: typeof tenantData.amenities === 'string' ? tenantData.amenities : (Array.isArray(tenantData.amenities) ? tenantData.amenities.join(', ') : ''),
      preferences: typeof tenantData.preferences === 'string' ? tenantData.preferences : JSON.stringify(tenantData.preferences || {}),
      source: tenantData.source || 'call',
      consent_timestamp: tenantData.consent_timestamp || new Date().toISOString(),
      consent_scope: typeof tenantData.consent_scope === 'string' ? tenantData.consent_scope : (Array.isArray(tenantData.consent_scope) ? tenantData.consent_scope.join(', ') : ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    tenants.push(newTenant);
    await writeCSV(TENANTS_CSV, tenants, [
      'tenant_id', 'name', 'phone', 'whatsapp_number', 'email', 
      'city', 'localities', 'budget_min', 'budget_max', 
      'move_in_date', 'bedrooms', 'amenities', 'preferences', 
      'source', 'consent_timestamp', 'consent_scope', 'created_at', 'updated_at'
    ]);
    
    return newTenant;
  },

  async updateTenant(tenantId: string, updates: any): Promise<any | null> {
    const tenants = await readCSV<any>(TENANTS_CSV);
    const index = tenants.findIndex(t => t.tenant_id === tenantId);
    if (index === -1) return null;
    
    tenants[index] = {
      ...tenants[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await writeCSV(TENANTS_CSV, tenants, [
      'tenant_id', 'name', 'phone', 'whatsapp_number', 'email', 
      'city', 'localities', 'budget_min', 'budget_max', 
      'move_in_date', 'bedrooms', 'amenities', 'preferences', 
      'source', 'consent_timestamp', 'consent_scope', 'created_at', 'updated_at'
    ]);
    
    return tenants[index];
  },

  // Leads
  async getLeads(filters?: { owner_id?: string; tenant_id?: string; property_id?: string; status?: string }): Promise<any[]> {
    const leads = await readCSV<any>(LEADS_CSV);
    let filtered = leads;
    
    if (filters?.tenant_id) {
      filtered = filtered.filter(l => l.tenant_id === filters.tenant_id);
    }
    if (filters?.property_id) {
      filtered = filtered.filter(l => l.property_id === filters.property_id);
    }
    if (filters?.status) {
      filtered = filtered.filter(l => l.status === filters.status);
    }
    
    // If owner_id filter, need to join with properties
    if (filters?.owner_id) {
      const properties = await this.getProperties({ owner_id: filters.owner_id });
      const propertyIds = properties.map(p => p.property_id);
      filtered = filtered.filter(l => propertyIds.includes(l.property_id));
    }
    
    return filtered.sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  },

  async getLeadById(leadId: string): Promise<any | null> {
    const leads = await readCSV<any>(LEADS_CSV);
    return leads.find(l => l.lead_id === leadId) || null;
  },

  async createLead(leadData: any): Promise<any> {
    const leads = await readCSV<any>(LEADS_CSV);
    const leadId = leadData.lead_id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newLead = {
      lead_id: leadId,
      tenant_id: leadData.tenant_id || '',
      property_id: leadData.property_id || '',
      property_code: leadData.property_code || '',
      channel: leadData.channel || 'call',
      call_recording_url: leadData.call_recording_url || '',
      transcript: leadData.transcript || '',
      nlp_extracted: typeof leadData.nlp_extracted === 'string' ? leadData.nlp_extracted : JSON.stringify(leadData.nlp_extracted || {}),
      match_score: leadData.match_score || '',
      owner_notified: leadData.owner_notified || 'false',
      status: leadData.status || 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    leads.push(newLead);
    await writeCSV(LEADS_CSV, leads, [
      'lead_id', 'tenant_id', 'property_id', 'property_code', 
      'channel', 'call_recording_url', 'transcript', 'nlp_extracted', 
      'match_score', 'owner_notified', 'status', 'created_at', 'updated_at'
    ]);
    
    return newLead;
  },

  async updateLead(leadId: string, updates: any): Promise<any | null> {
    const leads = await readCSV<any>(LEADS_CSV);
    const index = leads.findIndex(l => l.lead_id === leadId);
    if (index === -1) return null;
    
    leads[index] = {
      ...leads[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await writeCSV(LEADS_CSV, leads, [
      'lead_id', 'tenant_id', 'property_id', 'property_code', 
      'channel', 'call_recording_url', 'transcript', 'nlp_extracted', 
      'match_score', 'owner_notified', 'status', 'created_at', 'updated_at'
    ]);
    
    return leads[index];
  }
};

