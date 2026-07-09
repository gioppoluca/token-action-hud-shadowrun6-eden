/**
 * Module-based constants.
 */
export const MODULE = {
    ID: 'token-action-hud-shadowrun6-eden'
}

/**
 * Core module.
 */
export const CORE_MODULE = {
    ID: 'token-action-hud-core'
}

/**
 * Core module version required by the system module.
 */
export const REQUIRED_CORE_MODULE_VERSION = '2.1'

/**
 * Shadowrun 6 Eden system id.
 */
export const SYSTEM = {
    ID: 'shadowrun6-eden'
}

/**
 * Action types.
 */
export const ACTION_TYPE = {
    attribute: 'tokenActionHud.shadowrun6.attribute',
    defense: 'tokenActionHud.shadowrun6.defense',
    derived: 'tokenActionHud.shadowrun6.derived',
    item: 'tokenActionHud.shadowrun6.item',
    matrix: 'tokenActionHud.shadowrun6.matrix',
    matrixAccess: 'tokenActionHud.shadowrun6.matrixAccess',
    reload: 'tokenActionHud.shadowrun6.reload',
    resistance: 'tokenActionHud.shadowrun6.resistance',
    skill: 'tokenActionHud.shadowrun6.skill',
    utility: 'tokenActionHud.utility'
}

/**
 * Groups.
 */
export const GROUP = {
    attributes: { id: 'attributes', name: 'tokenActionHud.shadowrun6.attributes', type: 'system' },
    derived: { id: 'derived', name: 'tokenActionHud.shadowrun6.derived', type: 'system' },
    skills: { id: 'skills', name: 'tokenActionHud.shadowrun6.skills', type: 'system' },
    weapons: { id: 'weapons', name: 'tokenActionHud.shadowrun6.weapons', type: 'system' },
    armor: { id: 'armor', name: 'tokenActionHud.shadowrun6.armor', type: 'system' },
    augmentations: { id: 'augmentations', name: 'tokenActionHud.shadowrun6.augmentations', type: 'system' },
    gear: { id: 'gear', name: 'tokenActionHud.shadowrun6.gear', type: 'system' },
    qualities: { id: 'qualities', name: 'tokenActionHud.shadowrun6.qualities', type: 'system' },
    spells: { id: 'spells', name: 'tokenActionHud.shadowrun6.spells', type: 'system' },
    rituals: { id: 'rituals', name: 'tokenActionHud.shadowrun6.rituals', type: 'system' },
    powers: { id: 'powers', name: 'tokenActionHud.shadowrun6.powers', type: 'system' },
    resonance: { id: 'resonance', name: 'tokenActionHud.shadowrun6.resonance', type: 'system' },
    matrix: { id: 'matrix', name: 'tokenActionHud.shadowrun6.matrix', type: 'system' },
    matrixAccess: { id: 'matrixAccess', name: 'tokenActionHud.shadowrun6.matrixAccess', type: 'system' },
    defense: { id: 'defense', name: 'tokenActionHud.shadowrun6.defense', type: 'system' },
    resistance: { id: 'resistance', name: 'tokenActionHud.shadowrun6.resistance', type: 'system' },
    combat: { id: 'combat', name: 'tokenActionHud.combat', type: 'system' },
    utility: { id: 'utility', name: 'tokenActionHud.utility', type: 'system' }
}

export const ATTRIBUTE_IDS = ['bod', 'agi', 'rea', 'str', 'wil', 'log', 'int', 'cha', 'mag', 'res']

/**
 * Defense actions supported by Shadowrun6Actor.rollDefense(defendWith, threshold, damage, monitor).
 * Matrix defense and soak/resistance checks use separate generic/common check flows.
 */
export const DEFENSE_ACTIONS = [
    { id: 'physical', name: 'tokenActionHud.shadowrun6.defensePhysical', defendWith: 'physical' },
    { id: 'spells_indirect', name: 'tokenActionHud.shadowrun6.defenseSpellIndirect', defendWith: 'spells_indirect' },
    { id: 'spells_direct', name: 'tokenActionHud.shadowrun6.defenseSpellDirect', defendWith: 'spells_direct' },
    { id: 'spells_other', name: 'tokenActionHud.shadowrun6.defenseSpellOther', defendWith: 'spells_other' }
]

/**
 * Defense-pool checks implemented by the system sheet as generic/common defense rolls.
 */
export const RESISTANCE_ACTIONS = [
    { id: 'toxin', name: 'tokenActionHud.shadowrun6.resistanceToxin' },
    { id: 'damage_physical', name: 'tokenActionHud.shadowrun6.resistanceDamagePhysical' },
    { id: 'damage_astral', name: 'tokenActionHud.shadowrun6.resistanceDamageAstral' },
    { id: 'drain', name: 'tokenActionHud.shadowrun6.resistanceDrain' },
    { id: 'fading', name: 'tokenActionHud.shadowrun6.resistanceFading' }
]

export const MATRIX_ACCESS_ACTIONS = [
    { id: 'outsider', name: 'shadowrun6.matrix.accessLevel.outsider' },
    { id: 'user', name: 'shadowrun6.matrix.accessLevel.user' },
    { id: 'admin', name: 'shadowrun6.matrix.accessLevel.admin' }
]

export const DERIVED_ACTIONS = ['composure', 'judge_intentions', 'memory', 'lift_carry', 'matrix_perception']
