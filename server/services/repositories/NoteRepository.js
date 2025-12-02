/**
 * NoteRepository
 *
 * Data access layer for documentation notes.
 * Notes are attached to entities via entityType and entityId.
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { supabase } from '../supabaseClient.js';

class NoteRepository extends BaseRepository {
  constructor() {
    super('documentation_notes', 'n');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      clientId: row.client_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      note: row.note,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
      if (data.clientId !== undefined) row.client_id = data.clientId;
    }

    if (data.entityType !== undefined) row.entity_type = data.entityType;
    if (data.entityId !== undefined) row.entity_id = data.entityId;
    if (data.note !== undefined) row.note = data.note;
    if (data.updatedBy !== undefined) row.updated_by = data.updatedBy;

    return row;
  }

  /**
   * Find notes by entity type and ID
   * @param {string} entityType - Type of entity (e.g., 'client', 'source')
   * @param {string} entityId - ID of the entity
   * @returns {Promise<Array>} Array of notes
   */
  async findByEntity(entityType, entityId) {
    await this.init();

    const { data, error } = await supabase
      .from('documentation_notes')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    if (error) throw error;
    return data.map((row) => this.mapRow(row));
  }

  /**
   * Upsert a note for an entity (create or update)
   * @param {string} entityType - Type of entity
   * @param {string} entityId - ID of the entity
   * @param {Object} data - Note data { note, clientId?, updatedBy? }
   * @returns {Promise<Object>} The saved note
   */
  async upsertByEntity(entityType, entityId, data) {
    await this.init();

    // Check if note already exists
    const { data: existing } = await supabase
      .from('documentation_notes')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();

    if (existing) {
      // Update existing note
      const { data: note, error } = await supabase
        .from('documentation_notes')
        .update({
          note: data.note,
          updated_by: data.updatedBy || '',
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: note.id,
        note: note.note,
        updatedAt: note.updated_at,
      };
    }

    // Create new note
    const noteId = this.generateId();
    const { data: note, error } = await supabase
      .from('documentation_notes')
      .insert({
        id: noteId,
        client_id: data.clientId,
        entity_type: entityType,
        entity_id: entityId,
        note: data.note,
        updated_by: data.updatedBy || '',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: note.id,
      note: note.note,
      updatedAt: note.updated_at,
    };
  }

  /**
   * Delete note by entity type and ID
   * @param {string} entityType - Type of entity
   * @param {string} entityId - ID of the entity
   * @returns {Promise<boolean>} True on success
   */
  async deleteByEntity(entityType, entityId) {
    await this.init();

    const { error } = await supabase
      .from('documentation_notes')
      .delete()
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    if (error) throw error;
    return true;
  }
}

export const noteRepository = new NoteRepository();
