export const ENGINE_DETAILS = {
  vslice: { name: "Base Game", icon: "vslice.png" },
  psych: { name: "Psych Engine", icon: "psych.png" },
  codename: { name: "Codename Engine", icon: "codename.png" },
  executable: { name: "Executable", icon: "exe.png" },
};

export const ENGINE_CATEGORY_IDS = {
  29202: "vslice",
  28367: "psych",
  34764: "codename",
  3827: "executable",
};

export const ENGINE_CATEGORY_ROOTS =
  Object.keys(ENGINE_CATEGORY_IDS).map(Number);

// GameBanana's obsolete Legacy Categories root. Keep 3833 for direct profile
// lookups that omit the root-category relationship.
export const EXCLUDED_MOD_CATEGORY_IDS = [43772, 3833];
