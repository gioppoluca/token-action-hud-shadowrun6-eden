import { MODULE } from './constants.js'

/**
 * Register module settings.
 * Called by Token Action HUD Core to register Token Action HUD system module settings.
 * @param {function} coreUpdate Token Action HUD Core update function.
 */
export function register(coreUpdate) {
    game.settings.register(MODULE.ID, 'displayZeroSkills', {
        name: game.i18n.localize('tokenActionHud.shadowrun6.settings.displayZeroSkills.name'),
        hint: game.i18n.localize('tokenActionHud.shadowrun6.settings.displayZeroSkills.hint'),
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
        onChange: (value) => {
            coreUpdate(value)
        }
    })

    game.settings.register(MODULE.ID, 'displayPassiveItems', {
        name: game.i18n.localize('tokenActionHud.shadowrun6.settings.displayPassiveItems.name'),
        hint: game.i18n.localize('tokenActionHud.shadowrun6.settings.displayPassiveItems.hint'),
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: (value) => {
            coreUpdate(value)
        }
    })
}
