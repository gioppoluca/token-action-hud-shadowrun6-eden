import { GROUP } from './constants.js'

/**
 * Default layout and groups.
 */
export let DEFAULTS = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    const groups = foundry.utils.deepClone(GROUP)

    Object.values(groups).forEach(group => {
        const localizedName = coreModule.api.Utils.i18n(group.name)
        group.name = localizedName
        group.listName = `Group: ${localizedName}`
    })

    DEFAULTS = {
        layout: [
            {
                nestId: 'tests',
                id: 'tests',
                name: coreModule.api.Utils.i18n('tokenActionHud.shadowrun6.tests'),
                groups: [
                    { ...groups.attributes, nestId: 'tests_attributes' },
                    { ...groups.derived, nestId: 'tests_derived' },
                    { ...groups.skills, nestId: 'tests_skills' }
                ]
            },
            {
                nestId: 'combat',
                id: 'combat',
                name: coreModule.api.Utils.i18n('tokenActionHud.combat'),
                groups: [
                    { ...groups.weapons, nestId: 'combat_weapons' },
                    { ...groups.defense, nestId: 'combat_defense' },
                    { ...groups.resistance, nestId: 'combat_resistance' }
                ]
            },
            {
                nestId: 'inventory',
                id: 'inventory',
                name: coreModule.api.Utils.i18n('tokenActionHud.shadowrun6.inventory'),
                groups: [
                    { ...groups.armor, nestId: 'inventory_armor' },
                    { ...groups.augmentations, nestId: 'inventory_augmentations' },
                    { ...groups.gear, nestId: 'inventory_gear' },
                    { ...groups.qualities, nestId: 'inventory_qualities' }
                ]
            },
            {
                nestId: 'magicResonance',
                id: 'magicResonance',
                name: coreModule.api.Utils.i18n('tokenActionHud.shadowrun6.magicResonance'),
                groups: [
                    { ...groups.spells, nestId: 'magic_spells' },
                    { ...groups.rituals, nestId: 'magic_rituals' },
                    { ...groups.powers, nestId: 'magic_powers' },
                    { ...groups.resonance, nestId: 'resonance_resonance' }
                ]
            },
            {
                nestId: 'matrix',
                id: 'matrix',
                name: coreModule.api.Utils.i18n('tokenActionHud.shadowrun6.matrix'),
                groups: [
                    { ...groups.matrix, nestId: 'matrix_matrix' },
                    { ...groups.matrixAccess, nestId: 'matrix_access' }
                ]
            },
            {
                nestId: 'utility',
                id: 'utility',
                name: coreModule.api.Utils.i18n('tokenActionHud.utility'),
                groups: [
                    { ...groups.utility, nestId: 'utility_utility' }
                ]
            }
        ],
        groups: Object.values(groups)
    }
})
