/**
 * Leads Routes
 * Handles lead management for owners
 */

import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { csvStorage } from '../config/csvStorage';
import { createError } from '../middleware/errorHandler';

export const leadsRouter = Router();
leadsRouter.use(authenticate);

// Get all leads
leadsRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { owner_id, tenant_id, property_id, status } = req.query;
    
    const filters: any = {};
    if (tenant_id) filters.tenant_id = tenant_id as string;
    if (property_id) filters.property_id = property_id as string;
    if (status) filters.status = status as string;
    
    // If owner_id is provided, filter leads for that owner's properties
    let leads;
    if (owner_id) {
      leads = await csvStorage.getLeads({ ...filters, owner_id: owner_id as string });
    } else {
      leads = await csvStorage.getLeads(filters);
    }
    
    // Enrich leads with tenant and property information
    const enrichedLeads = await Promise.all(
      leads.map(async (lead) => {
        const tenant = lead.tenant_id 
          ? await csvStorage.getTenantById(lead.tenant_id)
          : null;
        const property = lead.property_id
          ? await csvStorage.getPropertyById(lead.property_id)
          : null;
        
        return {
          ...lead,
          tenant: tenant ? {
            tenant_id: tenant.tenant_id,
            name: tenant.name,
            phone: tenant.phone,
            city: tenant.city
          } : null,
          property: property ? {
            property_id: property.property_id,
            property_code: property.property_code,
            title: property.title,
            locality: property.locality,
            rent: property.rent
          } : null
        };
      })
    );
    
    res.json({ 
      status: 'success', 
      leads: enrichedLeads,
      count: enrichedLeads.length 
    });
  } catch (error) {
    next(error);
  }
});

// Get lead by ID
leadsRouter.get('/:leadId', async (req: AuthRequest, res, next) => {
  try {
    const { leadId } = req.params;
    const lead = await csvStorage.getLeadById(leadId);
    
    if (!lead) {
      throw createError('Lead not found', 404);
    }
    
    // Enrich with tenant and property information
    const tenant = lead.tenant_id 
      ? await csvStorage.getTenantById(lead.tenant_id)
      : null;
    const property = lead.property_id
      ? await csvStorage.getPropertyById(lead.property_id)
      : null;
    
    res.json({ 
      status: 'success', 
      lead: {
        ...lead,
        tenant,
        property
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create lead
leadsRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const leadData = {
      ...req.body,
      status: req.body.status || 'new',
      owner_notified: req.body.owner_notified || 'false'
    };

    const lead = await csvStorage.createLead(leadData);
    
    res.status(201).json({ 
      status: 'success', 
      lead 
    });
  } catch (error) {
    next(error);
  }
});

// Update lead
leadsRouter.put('/:leadId', async (req: AuthRequest, res, next) => {
  try {
    const { leadId } = req.params;
    const lead = await csvStorage.getLeadById(leadId);
    
    if (!lead) {
      throw createError('Lead not found', 404);
    }

    const updatedLead = await csvStorage.updateLead(leadId, req.body);
    
    res.json({ 
      status: 'success', 
      lead: updatedLead 
    });
  } catch (error) {
    next(error);
  }
});

// Claim lead (for owners)
leadsRouter.post('/:leadId/claim', async (req: AuthRequest, res, next) => {
  try {
    const { leadId } = req.params;
    const { owner_user_id } = req.body;
    
    const lead = await csvStorage.getLeadById(leadId);
    if (!lead) {
      throw createError('Lead not found', 404);
    }

    const updatedLead = await csvStorage.updateLead(leadId, {
      status: 'claimed',
      owner_user_id: owner_user_id || req.user!.id,
      owner_notified: 'true'
    });
    
    res.json({ 
      status: 'success', 
      lead: updatedLead,
      message: 'Lead claimed successfully'
    });
  } catch (error) {
    next(error);
  }
});

