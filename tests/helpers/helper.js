/**
 * Helper fuinction to ease updating herd
 * @param player
 * @param partial
 */
export function setHerd(player, partial) {
    Object.entries(partial).forEach(([k, v]) => player.updateHerd(k, v));
}
