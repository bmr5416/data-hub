/**
 * SettingsRepository
 *
 * Data access layer for application settings.
 * Uses a key-value store pattern.
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { supabase } from '../supabaseClient.js';

class SettingsRepository extends BaseRepository {
  constructor() {
    super('settings', 'set');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      key: row.key,
      value: row.value,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (data.key !== undefined) row.key = data.key;
    if (data.value !== undefined) row.value = data.value;

    return row;
  }

  /**
   * Get a setting value by key
   * @param {string} key - Setting key
   * @returns {Promise<*>} Setting value or null if not found
   */
  async findByKey(key) {
    await this.init();

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
   * Set a setting value (upsert)
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @returns {Promise<boolean>} True on success
   */
  async upsert(key, value) {
    await this.init();

    const { error } = await supabase
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) throw error;
    return true;
  }

  /**
   * Delete a setting by key
   * @param {string} key - Setting key
   * @returns {Promise<boolean>} True on success
   */
  async deleteByKey(key) {
    await this.init();

    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('key', key);

    if (error) throw error;
    return true;
  }
}

export const settingsRepository = new SettingsRepository();
