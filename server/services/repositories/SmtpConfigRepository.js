/**
 * SmtpConfigRepository
 *
 * Data access layer for SMTP configuration.
 * Handles encryption of sensitive credentials.
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { supabase } from '../supabaseClient.js';
import { encrypt } from '../../utils/crypto.js';

class SmtpConfigRepository extends BaseRepository {
  constructor() {
    super('smtp_config', 'smtp');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      host: row.host,
      port: row.port,
      secure: row.secure,
      authUser: row.auth_user,
      authPass: row.auth_pass_encrypted, // Keep encrypted for service layer
      fromEmail: row.from_email,
      fromName: row.from_name,
      isDefault: row.is_default,
      isVerified: row.is_verified,
      lastVerifiedAt: row.last_verified_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
    }

    if (data.name !== undefined) row.name = data.name;
    if (data.host !== undefined) row.host = data.host;
    if (data.port !== undefined) row.port = data.port;
    if (data.secure !== undefined) row.secure = data.secure;
    if (data.authUser !== undefined) row.auth_user = data.authUser;
    if (data.authPass !== undefined) {
      row.auth_pass_encrypted = data.authPass ? encrypt(data.authPass) : null;
    }
    if (data.fromEmail !== undefined) row.from_email = data.fromEmail;
    if (data.fromName !== undefined) row.from_name = data.fromName;
    if (data.isDefault !== undefined) row.is_default = data.isDefault;
    if (data.isVerified !== undefined) row.is_verified = data.isVerified;
    if (data.lastVerifiedAt !== undefined) row.last_verified_at = data.lastVerifiedAt;

    return row;
  }

  /**
   * Find all SMTP configs ordered by creation date
   * @returns {Promise<Array>} Array of SMTP configs
   */
  async findAll() {
    await this.init();

    const { data, error } = await supabase
      .from('smtp_config')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((row) => this.mapRow(row));
  }

  /**
   * Find the default SMTP config
   * @returns {Promise<Object|null>} Default config or null
   */
  async findDefault() {
    await this.init();

    const { data, error } = await supabase
      .from('smtp_config')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapRow(data);
  }

  /**
   * Create a new SMTP config
   * If isDefault is true, unsets other defaults first
   * @param {Object} data - Config data
   * @returns {Promise<Object>} Created config
   */
  async create(data) {
    await this.init();

    const configId = this.generateId(data.id);

    // If this is set as default, unset any existing default
    if (data.isDefault) {
      await this._clearDefaultFlag();
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
    return this.mapRow(config);
  }

  /**
   * Update an SMTP config
   * If isDefault is true, unsets other defaults first
   * @param {string} configId - Config ID
   * @param {Object} data - Fields to update
   * @returns {Promise<Object|null>} Updated config or null
   */
  async update(configId, data) {
    await this.init();

    // If setting as default, unset any existing default
    if (data.isDefault) {
      await this._clearDefaultFlag(configId);
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

    return this.mapRow(config);
  }

  /**
   * Update verification status
   * @param {string} configId - Config ID
   * @param {boolean} isVerified - Verification status
   * @param {string|null} lastVerifiedAt - Verification timestamp
   * @returns {Promise<Object|null>} Updated config or null
   */
  async updateVerificationStatus(configId, isVerified, lastVerifiedAt = null) {
    return this.update(configId, {
      isVerified,
      lastVerifiedAt: lastVerifiedAt || new Date().toISOString(),
    });
  }

  /**
   * Set a config as the default (unsets others)
   * @param {string} configId - Config ID to set as default
   * @returns {Promise<Object|null>} Updated config or null
   */
  async setDefault(configId) {
    await this._clearDefaultFlag(configId);
    return this.update(configId, { isDefault: true });
  }

  /**
   * Clear the default flag from all configs except the excluded one
   * @private
   * @param {string|null} excludeId - Config ID to exclude from clearing
   */
  async _clearDefaultFlag(excludeId = null) {
    await this.init();

    let query = supabase
      .from('smtp_config')
      .update({ is_default: false })
      .eq('is_default', true);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    await query;
  }
}

export const smtpConfigRepository = new SmtpConfigRepository();
