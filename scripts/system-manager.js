import { ActionHandler } from './action-handler.js'
import { RollHandler as Core } from './roll-handler.js'
import { DEFAULTS } from './defaults.js'
import { MODULE } from './constants.js'
import * as systemSettings from './settings.js'

export let SystemManager = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's SystemManager class.
     */
    SystemManager = class SystemManager extends coreModule.api.SystemManager {
        /** @override */
        getActionHandler() {
            return new ActionHandler()
        }

        /** @override */
        getAvailableRollHandlers() {
            return { core: 'Core Shadowrun 6 Eden' }
        }

        /** @override */
        getRollHandler(_rollHandlerId) {
            return new Core()
        }

        /** @override */
        async registerDefaults() {
            return DEFAULTS
        }

        /** @override */
        registerSettings(coreUpdate) {
            systemSettings.register(coreUpdate)
        }

        /** @override */
        registerStyles() {
            return {
                shadowrun6: {
                    class: 'tah-style-shadowrun6-style',
                    file: 'tah-shadowrun6',
                    moduleId: MODULE.ID,
                    name: 'Shadowrun 6 Eden'
                }
            }
        }
    }
})
