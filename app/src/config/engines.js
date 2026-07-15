export const ENGINE_DETAILS = {
  vslice: { name: "Base Game", icon: "vslice.png" },
  psych: { name: "Psych Engine", icon: "psych.png" },
  codename: { name: "Codename Engine", icon: "codename.png" },
  executable: { name: "Executable", icon: "exe.png" },
};

// Launch behavior is separate from display/category metadata so new engines can
// declare whether their mods share one process or are selected per launch.
export const ENGINE_LAUNCH_BEHAVIORS = {
  default: { scope: "shared-engine", usesModArgument: false },
  vslice: { scope: "shared-engine", usesModArgument: false },
  psych: { scope: "shared-engine", usesModArgument: false },
  codename: { scope: "exclusive-mod", usesModArgument: true },
};

export function getEngineLaunchBehavior(engineId) {
  return ENGINE_LAUNCH_BEHAVIORS[engineId] || ENGINE_LAUNCH_BEHAVIORS.default;
}

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
