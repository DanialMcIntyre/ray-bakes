import { supabase } from './supabaseClient';

export type Flavour = { flavour: string; description?: string | null; ingredients?: string | null; image_path?: string | null; hidden?: boolean | null };

// Helper to fetch flavours/menu items from the `menu` table.
export async function fetchMenuItems(): Promise<Flavour[]> {
  try {
    const { data, error } = await supabase
      .from('menu')
      .select('id, flavour, description, ingredients, image_path, hidden')
      .order('flavour', { ascending: true });

    if (error) throw error;
    return (data || []) as Flavour[];
  } catch (err) {
    console.error('fetchMenuItems error', err);
    return [];
  }
}

// Default export kept for compatibility with existing imports — it is an empty
// array so callers that expect synchronous data won't break. Prefer using
// `fetchMenuItems()` in async contexts or the components' own DB queries.
const empty: Flavour[] = [];
export default empty;

