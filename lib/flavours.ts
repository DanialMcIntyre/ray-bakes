import { supabase } from './supabaseClient';

export type Flavour = { flavour: string; description?: string; ingredients?: string; image?: string };

export const flavours: Flavour[] = [
  { flavour: "Chocolate Chip", description: "Classic, gooey, and comforting.", ingredients: "Flour, Sugar, Butter, Chocolate Chips", image: "/cookies/choco.jpg" },
  { flavour: "Oreo", description: "Cookies and cream delight.", ingredients: "Flour, Cocoa, Sugar, Butter, Vanilla", image: "/cookies/oreo.jpg" },
  { flavour: "Biscoff", description: "Caramelized spice goodness.", ingredients: "Flour, Sugar, Biscoff Spread, Butter", image: "/cookies/biscoff.jpg" },
  { flavour: "Birthday Cake", description: "Vanilla cookie with sprinkles.", ingredients: "Flour, Sugar, Butter, Sprinkles, Vanilla", image: "/cookies/birthday.jpg" },
];

type FlavourRow = {
  flavour?: string;
  description?: string;
  ingredients?: string;
  image?: string;
};
// Replace only the `flavour` names in the exported `flavours` array with the
// authoritative list from the DB view `flavours_view`. This mutates the
// exported array in-place so existing imports keep the same object reference.
(async function replaceFlavourNames() {
  try {
    const { data, error } = await supabase.from('flavours_view').select('flavour');
    if (!error && data && Array.isArray(data) && data.length > 0) {
      const names = (data as { flavour?: string }[]).map(r => r.flavour).filter(Boolean) as string[];
      for (let i = 0; i < Math.min(names.length, flavours.length); i++) {
        flavours[i].flavour = names[i];
      }
      for (let i = flavours.length; i < names.length; i++) {
        flavours.push({ flavour: names[i] });
      }
    }
  } catch (err) {
    console.error('replaceFlavourNames error', err);
  }
})();

export default flavours;

