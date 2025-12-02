/**
 * Settings Service
 *
 * Database operations for settings, SMTP config, and global configuration.
 */

import {
  getClient,
  generateId,
} from './BaseService.js';
import { encrypt } from '../../utils/crypto.js';

// ========== GENERAL SETTINGS ==========

/**
 * Get a setting value
 */
export async function getSetting(key) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data.value;
}

/**
 * Set a setting value
 */
export async function setSetting(key, value) {
  const supabase = getClient();

  const { error } = await supabase
    .from('settings')
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) throw error;
  return true;
}

// ========== SMTP CONFIG OPERATIONS ==========

/**
 * Map SMTP config row
 */
function mapSmtpConfigRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    host: row.host,
    port: row.port,
    secure: row.secure,
    authUser: row.auth_user,
    authPass: row.auth_pass_encrypted, // Decryption happens in EmailService
    fromEmail: row.from_email,
    fromName: row.from_name,
    isDefault: row.is_default,
    isVerified: row.is_verified,
    lastVerifiedAt: row.last_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all SMTP configs
 */
export async function getSmtpConfigs() {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('smtp_config')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapSmtpConfigRow);
}

/**
 * Get SMTP config by ID
 */
export async function getSmtpConfig(configId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('smtp_config')
    .select('*')
    .eq('id', configId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapSmtpConfigRow(data);
}

/**
 * Get default SMTP config
 */
export async function getDefaultSmtpConfig() {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('smtp_config')
    .select('*')
    .eq('is_default', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapSmtpConfigRow(data);
}

/**
 * Create SMTP config
 */
export async function createSmtpConfig(data) {
  const supabase = getClient();
  const configId = generateId('smtp');

  // If this is set as default, unset any existing default
  if (data.isDefault) {
    await supabase
      .from('smtp_config')
      .update({ is_default: false })
      .eq('is_default', true);
  }

  const { data: config, error } = await supabase
    .from('smtp_config')
    .insert({
      id: configId,
      name: data.name || 'Default',
      host: data.host,
      port: data.port || 587,
      secure: data.secure || false,
      auth_user: data.authUser || null,
      auth_pass_encrypted: data.authPass ? encrypt(data.authPass) : null,
      from_email: data.fromEmail,
      from_name: data.fromName || null,
      is_default: data.isDefault || false,
      is_verified: false,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSmtpConfigRow(config);
}

/**
 * Update SMTP config
 */
export async function updateSmtpConfig(configId, data) {
  const supabase = getClient();

  // If setting as default, unset any existing default
  if (data.isDefault) {
    await supabase
      .from('smtp_config')
      .update({ is_default: false })
      .eq('is_default', true)
      .neq('id', configId);
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.host !== undefined) updateData.host = data.host;
  if (data.port !== undefined) updateData.port = data.port;
  if (data.secure !== undefined) updateData.secure = data.secure;
  if (data.authUser !== undefined) updateData.auth_user = data.authUser;
  if (data.authPass !== undefined) {
    updateData.auth_pass_encrypted = data.authPass ? encrypt(data.authPass) : null;
  }
  if (data.fromEmail !== undefined) updateData.from_email = data.fromEmail;
  if (data.fromName !== undefined) updateData.from_name = data.fromName;
  if (data.isDefault !== undefined) updateData.is_default = data.isDefault;
  if (data.isVerified !== undefined) updateData.is_verified = data.isVerified;
  if (data.lastVerifiedAt !== undefined) updateData.last_verified_at = data.lastVerifiedAt;

  const { data: config, error } = await supabase
    .from('smtp_config')
    .update(updateData)
    .eq('id', configId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapSmtpConfigRow(config);
}

/**
 * Delete SMTP config
 */
export async function deleteSmtpConfig(configId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('smtp_config')
    .delete()
    .eq('id', configId);

  if (error) throw error;
  return true;
}
