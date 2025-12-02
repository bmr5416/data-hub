/**
 * Notes Service
 *
 * Database operations for documentation notes.
 */

import {
  getClient,
  generateId,
} from './BaseService.js';

/**
 * Map notes row to JS object
 */
function mapNoteRow(row) {
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

/**
 * Get notes for an entity
 */
export async function getNotes(entityType, entityId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('documentation_notes')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (error) throw error;
  return data.map(mapNoteRow);
}

/**
 * Save (create or update) a note
 */
export async function saveNote(entityType, entityId, data) {
  const supabase = getClient();

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
  const noteId = generateId('n');
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
 * Delete a note
 */
export async function deleteNote(entityType, entityId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('documentation_notes')
    .delete()
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (error) throw error;
  return true;
}
