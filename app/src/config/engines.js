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
