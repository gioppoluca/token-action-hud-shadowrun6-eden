import { Utils } from './utils.js'

export let RollHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's RollHandler class and handles Shadowrun 6 Eden actions.
     */
    RollHandler = class RollHandler extends coreModule.api.RollHandler {
        /**
         * Handle action click.
         * Called by Token Action HUD Core when an action is left or right-clicked.
         * @override
         * @param {object} event        The event.
         * @param {string} encodedValue The encoded value.
         */
        async handleActionClick(event, encodedValue) {
            const [actionTypeId, ...actionParts] = encodedValue.split(this.delimiter)
            const actionId = actionParts.join(this.delimiter)

            if (actionTypeId === 'item' && this.isRenderItem()) {
                return this.doRenderItem(this.actor, actionId)
            }

            if (this.actor) {
                await this.#handleAction(event, this.actor, this.token, actionTypeId, actionId)
                return
            }

            for (const token of this.#controlledShadowrunTokens()) {
                await this.#handleAction(event, token.actor, token, actionTypeId, actionId)
            }
        }

        /** @override */
        async handleActionHover(_event, _encodedValue) { }

        /** @override */
        async handleGroupClick(_event, _group) { }

        async #handleAction(event, actor, token, actionTypeId, actionId) {
            switch (actionTypeId) {
                case 'attribute':
                    return this.#handleAttributeAction(actor, actionId)
                case 'derived':
                    return this.#handleDerivedAction(actor, actionId)
                case 'skill':
                    return this.#handleSkillAction(actor, actionId)
                case 'item':
                    return this.#handleItemAction(actor, actionId)
                case 'reload':
                    return this.#handleReloadAction(actor, actionId)
                case 'defense':
                    return this.#handleDefenseAction(actor, actionId)
                case 'resistance':
                    return this.#handleResistanceAction(actor, actionId)
                case 'matrix':
                    return this.#handleMatrixAction(actor, actionId)
                case 'matrixAccess':
                    return this.#handleMatrixAccessAction(actor, actionId)
                case 'utility':
                    return this.#handleUtilityAction(token, actionId)
                default:
                    return ui.notifications.warn(`Unknown Token Action HUD Shadowrun action: ${actionTypeId}`)
            }
        }

        async #handleAttributeAction(actor, attributeId) {
            const rollTypes = await Utils.importRollTypes()
            const attributeName = Utils.localize(`attrib.${attributeId}`, attributeId.toUpperCase())
            const roll = this.#preparedRoll(rollTypes, rollTypes.RollType?.Common ?? 'common')

            roll.pool = this.#attributePool(actor, attributeId)
            roll.actionText = game.sr6?.utils?.rollText?.('attributeonly-roll attribute-poolmod', attributeId) ?? attributeName
            roll.checkText = roll.actionText
            roll.title = roll.actionText
            roll.allowBuyHits = true
            roll.useAttributeMod = true
            roll.attributeTested = attributeId
            roll.performer = actor.system

            return this.#rollCommon(actor, roll, {
                useModifier: true,
                useThreshold: true
            }, attributeName)
        }


        async #handleDerivedAction(actor, rollId) {
            const rollTypes = await Utils.importRollTypes()
            const derived = actor.system?.derived?.[rollId]
            const label = Utils.localize(`shadowrun6.derived.${rollId}`, this.#humanize(rollId))
            const roll = this.#preparedRoll(rollTypes, rollTypes.RollType?.Common ?? 'common')

            roll.pool = this.#pool(derived)
            roll.actionText = game.sr6?.utils?.rollText?.('attributeonly-roll skill-pool', rollId) ?? label
            roll.checkText = roll.actionText
            roll.title = roll.actionText
            roll.allowBuyHits = true
            roll.performer = actor.system

            return this.#rollCommon(actor, roll, {
                useModifier: true,
                useThreshold: true
            }, label)
        }

        async #handleSkillAction(actor, actionId) {
            const [skillId, skillSpec] = actionId.split(';')
            const rollTypes = await Utils.importRollTypes()

            try {
                const roll = new rollTypes.SkillRoll(actor.system, skillId)
                roll.skillSpec = skillSpec || undefined
                return actor.rollSkill(roll)
            } catch (error) {
                console.warn('Token Action HUD Shadowrun 6 Eden | Falling back from SkillRoll constructor.', error)
            }

            const roll = this.#preparedRoll(rollTypes, rollTypes.RollType?.Skill ?? 'skill')
            roll.skillId = skillId
            roll.skillSpec = skillSpec || undefined
            roll.skillDef = CONFIG.SR6?.ATTRIB_BY_SKILL?.get?.(skillId)
            roll.skillValue = actor.system?.skills?.[skillId]
            roll.attrib = roll.skillDef?.attrib
            roll.performer = actor.system

            if (typeof actor.rollSkill === 'function') return actor.rollSkill(roll)

            const pool = this.#skillPool(actor, skillId, skillSpec)
            const label = this.#skillLabel(skillId, skillSpec)
            return this.#fallbackPoolRoll(actor, pool, label)
        }

        async #handleItemAction(actor, itemId) {
            const item = actor.items.get(itemId)
            if (!item) return

            if (this.#isWeaponOrSkillGear(item)) return this.#rollGear(actor, item)
            if (item.type === 'spell') return this.#rollSpell(actor, item, false)
            if (item.type === 'ritual') return this.#rollSpell(actor, item, true)
            if (item.type === 'complexform') return this.#rollComplexForm(actor, item)

            return this.#toChat(item)
        }

        async #handleReloadAction(actor, itemId) {
            const item = actor.items.get(itemId)
            if (!item) return

            const capacity = Number(item.system?.ammocap ?? 0)
            if (capacity <= 0) return ui.notifications.warn(`${item.name}: ${game.i18n.localize('tokenActionHud.shadowrun6.noAmmoCapacity')}`)

            await item.update({ 'system.ammocount': capacity })
            return ui.notifications.info(game.i18n.format('tokenActionHud.shadowrun6.reloaded', { name: item.name, count: capacity }))
        }

        async #handleDefenseAction(actor, defendWith) {
            if (typeof actor.rollDefense !== 'function') return ui.notifications.warn('Shadowrun 6 Eden actor.rollDefense is not available.')
            return actor.rollDefense(defendWith, 0)
        }

        async #handleResistanceAction(actor, rollId) {
            const rollTypes = await Utils.importRollTypes()
            const defensePool = actor.system?.defensepool?.[rollId]
            const label = Utils.localize(`shadowrun6.defense.${rollId}`, this.#humanize(rollId))
            const rollType = ['damage_physical', 'damage_astral'].includes(rollId)
                ? rollTypes.RollType?.Soak ?? 'soak'
                : rollTypes.RollType?.Common ?? 'common'

            const roll = this.#preparedRoll(rollTypes, rollType)
            roll.pool = this.#pool(defensePool)
            roll.actionText = game.sr6?.utils?.rollText?.('defense-roll skill-pool', rollId) ?? label
            roll.checkText = roll.actionText
            roll.title = roll.actionText
            roll.threshold = 1
            roll.allowBuyHits = false
            roll.performer = actor.system

            return this.#rollCommon(actor, roll, {
                useModifier: !['damage_physical', 'damage_astral'].includes(rollId),
                useThreshold: false
            }, label)
        }

        async #handleMatrixAction(actor, actionId) {
            if (typeof actor.performMatrixAction !== 'function') return ui.notifications.warn('Shadowrun 6 Eden actor.performMatrixAction is not available.')

            const action = CONFIG.SR6?.MATRIX_ACTIONS?.[actionId]
            if (!action?.skill) return ui.notifications.warn(`Shadowrun 6 Eden matrix action '${actionId}' has no rollable skill.`)

            const rollTypes = await Utils.importRollTypes()
            try {
                const roll = new rollTypes.MatrixActionRoll(actor.system, action)
                return actor.performMatrixAction(roll)
            } catch (error) {
                console.warn('Token Action HUD Shadowrun 6 Eden | Falling back from MatrixActionRoll constructor.', error)
            }

            const roll = this.#preparedRoll(rollTypes, rollTypes.RollType?.MatrixAction ?? 'matrix')
            roll.action = action
            return actor.performMatrixAction(roll)
        }

        async #handleMatrixAccessAction(actor, accessLevel) {
            if (!['outsider', 'user', 'admin'].includes(accessLevel)) return
            await actor.setFlag('shadowrun6-eden', 'matrix-access', accessLevel)
            return ui.notifications.info(game.i18n.format('tokenActionHud.shadowrun6.matrixAccessSet', {
                access: Utils.localize(`shadowrun6.matrix.accessLevel.${accessLevel}`, accessLevel)
            }))
        }

        async #handleUtilityAction(token, actionId) {
            switch (actionId) {
                case 'endTurn':
                    if (game.combat?.current?.tokenId === token?.id) await game.combat.nextTurn()
                    break
            }
        }

        async #rollGear(actor, item) {
            const rollTypes = await Utils.importRollTypes()
            const roll = new rollTypes.WeaponRoll(actor.system, item, item.id, item.system)
            roll.useWildDie = item.system?.wild ? 1 : 0

            if (typeof actor.rollItem === 'function') return actor.rollItem(roll)
            return this.#fallbackPoolRoll(actor, item.system?.pool ?? 0, item.name)
        }

        async #rollSpell(actor, item, ritual) {
            const rollTypes = await Utils.importRollTypes()
            const roll = ritual
                ? new rollTypes.RitualRoll(actor.system, item, item.id, item.system)
                : new rollTypes.SpellRoll(actor.system, item, item.id, item.system)

            if (typeof actor.rollSpell === 'function') return actor.rollSpell(roll, ritual)
            return this.#fallbackPoolRoll(actor, this.#skillPool(actor, 'sorcery', ritual ? 'ritual_spellcasting' : 'spellcasting'), item.name)
        }

        async #rollComplexForm(actor, item) {
            const rollTypes = await Utils.importRollTypes()
            const roll = new rollTypes.ComplexFormRoll(actor.system, item, item.id, item.system)

            if (typeof actor.rollComplexForm === 'function') return actor.rollComplexForm(roll)
            return this.#fallbackPoolRoll(actor, this.#skillPool(actor, item.system?.skill, item.system?.skillSpec), item.name)
        }

        async #rollCommon(actor, roll, dialogConfig, label) {
            if (typeof actor.rollCommonCheck === 'function') return actor.rollCommonCheck(roll, dialogConfig)
            return this.#doPreparedRoll(actor, roll, label)
        }

        #preparedRoll(rollTypes, rollType) {
            const roll = new rollTypes.PreparedRoll()
            roll.rollType = rollType
            return roll
        }

        async #doPreparedRoll(actor, roll, label) {
            roll.actor = actor
            roll.speaker = ChatMessage.getSpeaker({ actor })
            try {
                const rolls = await import('/systems/shadowrun6-eden/module/Rolls.js')
                if (typeof rolls.doRoll === 'function') return rolls.doRoll(roll)
            } catch (error) {
                console.warn('Token Action HUD Shadowrun 6 Eden | Falling back to simple pool roll.', error)
            }
            return this.#fallbackPoolRoll(actor, roll.pool ?? 0, label)
        }

        #isWeaponOrSkillGear(item) {
            if (item.type !== 'gear') return false
            return Boolean(item.system?.skill) || String(item.system?.type ?? '').startsWith('WEAPON_')
        }

        #skillPool(actor, skillId, skillSpec = '') {
            if (!skillId) return 0
            try {
                if (typeof actor._getSkillPool === 'function') return actor._getSkillPool(skillId, skillSpec)
            } catch {
                return 0
            }
            const skill = actor.system?.skills?.[skillId]
            return Number(skill?.pool ?? skill?.points ?? 0) + Number(skill?.modifier ?? 0) + Number(skill?.augment ?? 0)
        }

        #attributePool(actor, attributeId) {
            const attribute = actor.system?.attributes?.[attributeId]
            if (!attribute) return 0
            if (attribute.pool !== undefined) return Number(attribute.pool) || 0
            return Number(attribute.base ?? 0) + Number(attribute.mod ?? 0) + Number(attribute.augment ?? 0)
        }

        #pool(value) {
            if (value?.pool !== undefined) return Number(value.pool) || 0
            if (value?.value !== undefined) return Number(value.value) || 0
            if (value?.base !== undefined) return Number(value.base) + Number(value.mod ?? 0) + Number(value.augment ?? 0)
            return Number(value) || 0
        }

        #skillLabel(skillId, skillSpec = '') {
            const skillName = Utils.localize(`skill.${skillId}`, this.#humanize(skillId))
            if (!skillSpec) return skillName
            return `${skillName}: ${Utils.localize(`shadowrun6.special.${skillId}.${skillSpec}`, this.#humanize(skillSpec))}`
        }

        async #fallbackPoolRoll(actor, pool, label) {
            const dice = Math.max(Number(pool) || 0, 0)
            if (dice <= 0) return ui.notifications.warn(`${label}: no dice pool available.`)
            const roll = new Roll(`${dice}d6cs>=5`)
            await roll.evaluate({ async: true })
            return roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: label
            })
        }

        async #toChat(item) {
            const itemName = item.name
            const itemDescription = item.system?.description || item.system?.explain || game.i18n.localize('tokenActionHud.shadowrun6.noDescription')
            const content = `
                <div class="token-action-hud-shadowrun6 item-chat">
                    <h2>${itemName}</h2>
                    <div>${itemDescription}</div>
                </div>
            `

            return ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor: item.actor }),
                content
            })
        }

        #controlledShadowrunTokens() {
            return canvas.tokens.controlled.filter(token => token.actor?.system && token.actor?.type)
        }

        #humanize(value) {
            return String(value ?? '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase())
        }
    }
})
