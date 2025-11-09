/**
 * Calls Routes
 * Handles call logs and lead management
 */

import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { csvStorage } from '../config/csvStorage';
import { createError } from '../middleware/errorHandler';

export const callsRouter = Router();
callsRouter.use(authenticate);

// Get call logs (from leads)
callsRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { tenant_id, property_id, status } = req.query;
    
    const filters: any = {};
    if (tenant_id) filters.tenant_id = tenant_id as string;
    if (property_id) filters.property_id = property_id as string;
    if (status) filters.status = status as string;

    const leads = await csvStorage.getLeads(filters);
    
    // Convert leads to call format
    const calls = leads.map(lead => ({
      id: lead.lead_id,
      conversation_id: lead.lead_id,
      tenant_id: lead.tenant_id,
      property_id: lead.property_id,
      channel: lead.channel || 'call',
      transcript: lead.transcript,
      recording_url: lead.call_recording_url,
      status: lead.status,
      match_score: lead.match_score,
      created_at: lead.created_at,
      updated_at: lead.updated_at
    }));
    
    res.json({ 
      status: 'success', 
      calls,
      total: calls.length 
    });
  } catch (error) {
    next(error);
  }
});

// Get call by ID
callsRouter.get('/:callId', async (req: AuthRequest, res, next) => {
  try {
    const { callId } = req.params;
    const lead = await csvStorage.getLeadById(callId);
    
    if (!lead) {
      throw createError('Call not found', 404);
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
      call: {
        id: lead.lead_id,
        conversation_id: lead.lead_id,
        tenant_id: lead.tenant_id,
        property_id: lead.property_id,
        channel: lead.channel || 'call',
        transcript: lead.transcript,
        recording_url: lead.call_recording_url,
        status: lead.status,
        match_score: lead.match_score,
        nlp_extracted: lead.nlp_extracted,
        tenant,
        property,
        created_at: lead.created_at,
        updated_at: lead.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});
