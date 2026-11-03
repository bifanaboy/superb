const CAVEMAN_PLUGIN_IDS = new Set(['caveman', 'caveman-native', 'caveman-blocks']);

export function isCavemanPluginActive(plugins) {
  if (!Array.isArray(plugins)) return false;
  return plugins.some((plugin) => plugin && CAVEMAN_PLUGIN_IDS.has(plugin.id));
}
