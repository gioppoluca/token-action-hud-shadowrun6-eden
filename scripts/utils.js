import { MODULE, SYSTEM } from './constants.js'

export let Utils = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Utility functions.
     */
    Utils = class Utils {
        /**
         * Get setting.
         * @param {string} key               The key.
         * @param {string=null} defaultValue The default value.
         * @returns {string}                 The setting value.
         */
        static getSetting(key, defaultValue = null) {
            let value = defaultValue ?? null
            try {
                value = game.settings.get(MODULE.ID, key)
            } catch {
                coreModule.api.Logger.debug(`Setting '${key}' not found`)
            }
            return value
        }

        /**
         * Set setting.
         * @param {string} key   The key.
         * @param {string} value The value.
         */
        static async setSetting(key, value) {
            try {
                value = await game.settings.set(MODULE.ID, key, value)
                coreModule.api.Logger.debug(`Setting '${key}' set to '${value}'`)
            } catch {
                coreModule.api.Logger.debug(`Setting '${key}' not found`)
            }
        }

        static isShadowrun6Eden() {
            return game.system?.id === SYSTEM.ID
        }

        static localize(key, fallback = null) {
            const value = game.i18n.localize(key)
            return value === key ? (fallback ?? key) : value
        }

        static sortByName(documents) {
            return [...documents].sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang))
        }

        static async importRollTypes() {
            return import(`/systems/${SYSTEM.ID}/module/dice/RollTypes.js`)
        }
    }
})
