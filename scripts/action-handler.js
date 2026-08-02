import { ACTION_TYPE, ATTRIBUTE_IDS, DEFENSE_ACTIONS, DERIVED_ACTIONS, RESISTANCE_ACTIONS } from './constants.js'
import { Utils } from './utils.js'

export let ActionHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's ActionHandler class and builds Shadowrun 6 Eden actions.
     */
    ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
        /**
         * Build system actions.
         * Called by Token Action HUD Core.
         * @override
         */
        async buildSystemActions() {
            this.actors = (!this.actor) ? this._getActors() : [this.actor]
            this.actorType = this.actor?.type
            this.displayZeroSkills = Utils.getSetting('displayZeroSkills', false)
            this.displayPassiveItems = Utils.getSetting('displayPassiveItems', true)

            if (!Utils.isShadowrun6Eden()) return

            if (this.actor) {
                this.items = Utils.sortByName(this.actor.items?.values?.() ?? [])
                this.#buildActorActions()
            } else {
                this.#buildMultipleTokenActions()
            }
        }

        #buildActorActions() {
            this.#buildAttributes()
            this.#buildDerivedActions()
            this.#buildSkills()
            this.#buildItems()
            this.#buildDefenseActions()
            this.#buildResistanceActions()
            this.#buildMatrixActions()
            this.#buildUtilityActions()
        }

        #buildMultipleTokenActions() {
            this.#buildUtilityActions()
        }

        #buildAttributes() {
            const actions = ATTRIBUTE_IDS
                .map(attributeId => [attributeId, this.#attributeValue(attributeId)])
                .filter(([, attribute]) => attribute)
                .filter(([attributeId, attribute]) => this.#shouldShowAttribute(attributeId, attribute))
                .map(([attributeId, attribute]) => {
                    const name = this.#attributeName(attributeId)
                    return {
                        id: attributeId,
                        name: this.#nameWithPool(name, attribute),
                        listName: this.#listName('attribute', name),
                        encodedValue: ['attribute', attributeId].join(this.delimiter)
                    }
                })

            this.addActions(actions, { id: 'attributes', type: 'system' })
        }

        #buildDerivedActions() {
            const actions = DERIVED_ACTIONS
                .map(rollId => [rollId, this.#systemProperty(`derived.${rollId}`)])
                .filter(([, derived]) => derived)
                .map(([rollId, derived]) => {
                    const name = Utils.localize(`shadowrun6.derived.${rollId}`, this.#humanize(rollId))
                    return {
                        id: rollId,
                        name: this.#nameWithPool(name, derived),
                        listName: this.#listName('derived', name),
                        encodedValue: ['derived', rollId].join(this.delimiter)
                    }
                })

            this.addActions(actions, { id: 'derived', type: 'system' })
        }

        #buildSkills() {
            const skills = this.#systemProperty('skills') ?? {}
            const actions = []

            for (const [skillId, skill] of Object.entries(skills)) {
                if (!this.displayZeroSkills && this.#skillPool(skill) <= 0) continue

                const name = this.#skillName(skillId)
                actions.push({
                    id: skillId,
                    name: this.#nameWithPool(name, skill),
                    listName: this.#listName('skill', name),
                    encodedValue: ['skill', skillId].join(this.delimiter)
                })

                for (const specialization of this.#skillSpecializations(skill)) {
                    const specializationName = this.#specializationName(skillId, specialization)
                    actions.push({
                        id: `${skillId}.${specialization}`,
                        name: `${name}: ${specializationName}`,
                        listName: this.#listName('skill', `${name}: ${specializationName}`),
                        encodedValue: ['skill', `${skillId};${specialization}`].join(this.delimiter)
                    })
                }
            }

            this.addActions(actions, { id: 'skills', type: 'system' })
        }

        #buildItems() {
            const groups = new Map()

            for (const item of this.items) {
                const groupId = this.#itemGroupId(item)
                if (!groupId) continue
                if (!this.displayPassiveItems && !this.#isRollableItem(item)) continue

                const actions = groups.get(groupId) ?? []
                const name = this.#itemName(item)

                actions.push({
                    id: item.id,
                    name,
                    listName: this.#listName('item', name),
                    encodedValue: ['item', item.id].join(this.delimiter)
                })

                if (groupId === 'weapons' && this.#canReload(item)) {
                    const reloadName = `${coreModule.api.Utils.i18n('tokenActionHud.shadowrun6.reload')}: ${this.#ammoName(item)}`
                    actions.push({
                        id: `${item.id}.reload`,
                        name: reloadName,
                        listName: this.#listName('reload', reloadName),
                        encodedValue: ['reload', item.id].join(this.delimiter)
                    })
                }

                groups.set(groupId, actions)
            }

            for (const [groupId, actions] of groups) {
                this.addActions(actions, { id: groupId, type: 'system' })
            }
        }

        #buildDefenseActions() {
            const actions = DEFENSE_ACTIONS
                .map(action => [action, this.#systemProperty(`defensepool.${action.id}`)])
                .filter(([, defensePool]) => defensePool)
                .map(([action, defensePool]) => {
                    const name = coreModule.api.Utils.i18n(action.name)
                    return {
                        id: action.id,
                        name: this.#nameWithPool(name, defensePool),
                        listName: this.#listName('defense', name),
                        encodedValue: ['defense', action.defendWith].join(this.delimiter)
                    }
                })

            this.addActions(actions, { id: 'defense', type: 'system' })
        }

        #buildResistanceActions() {
            const actions = RESISTANCE_ACTIONS
                .map(action => [action, this.#systemProperty(`defensepool.${action.id}`)])
                .filter(([, defensePool]) => defensePool)
                .map(([action, defensePool]) => {
                    const name = coreModule.api.Utils.i18n(action.name)
                    return {
                        id: action.id,
                        name: this.#nameWithPool(name, defensePool),
                        listName: this.#listName('resistance', name),
                        encodedValue: ['resistance', action.id].join(this.delimiter)
                    }
                })

            this.addActions(actions, { id: 'resistance', type: 'system' })
        }

        #buildMatrixActions() {
            const matrixActions = CONFIG.SR6?.MATRIX_ACTIONS ?? {}
            const actorHasMatrix = this.actor?.system?.persona || this.actor?.system?.matrix
            if (!actorHasMatrix || !matrixActions) return

            const actions = Object.entries(matrixActions)
                .filter(([actionId, action]) => this.#isMatrixActionAvailable(actionId, action))
                .map(([actionId, action]) => {
                    const name = this.#matrixActionName(actionId, action)
                    return {
                        id: actionId,
                        name: this.#matrixNameWithPool(name, action),
                        listName: this.#listName('matrix', name),
                        encodedValue: ['matrix', actionId].join(this.delimiter)
                    }
                })

            this.addActions(actions, { id: 'matrix', type: 'system' })
        }

        #buildUtilityActions() {
            const actions = [
                {
                    id: 'endTurn',
                    name: coreModule.api.Utils.i18n('tokenActionHud.endTurn'),
                    listName: coreModule.api.Utils.i18n('tokenActionHud.endTurn'),
                    encodedValue: ['utility', 'endTurn'].join(this.delimiter)
                }
            ]

            this.addActions(actions, { id: 'utility', type: 'system' })
        }

        #shouldShowAttribute(attributeId, attribute) {
            if (['mag', 'res'].includes(attributeId)) return this.#pool(attribute) > 0
            return true
        }

        #attributeName(attributeId) {
            return Utils.localize(`attrib.${attributeId}`, attributeId.toUpperCase())
        }

        #skillName(skillId) {
            return Utils.localize(`skill.${skillId}`, this.#humanize(skillId))
        }

        #specializationName(skillId, specialization) {
            return Utils.localize(`shadowrun6.special.${skillId}.${specialization}`, this.#humanize(specialization))
        }

        #matrixActionName(actionId, action) {
            return Utils.localize(`shadowrun6.matrixaction.${actionId}.name`, action?.label ?? this.#humanize(actionId))
        }

        #itemName(item) {
            const rating = item.system?.rating
            if (!rating || item.name.match(/rating\s+\d+/i)) return item.name
            return `${item.name} (${coreModule.api.Utils.i18n('tokenActionHud.shadowrun6.rating')} ${rating})`
        }

        #ammoName(item) {
            const count = Number(item.system?.ammocount ?? 0)
            const capacity = Number(item.system?.ammocap ?? 0)
            return `${item.name} (${count}/${capacity})`
        }

        #nameWithPool(name, value) {
            const pool = this.#pool(value)
            return Number.isFinite(pool) && pool > 0 ? `${name} (${pool})` : name
        }

        #matrixNameWithPool(name, action) {
            const pool = this.#matrixPool(action)
            return Number.isFinite(pool) && pool > 0 ? `${name} (${pool})` : name
        }

        #listName(actionTypeId, name) {
            const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId])
            return `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`
        }

        #pool(value) {
            if (value?.pool !== undefined) return Number(value.pool) || 0
            if (value?.poolS !== undefined) return Number(value.poolS) || 0
            if (value?.poolE !== undefined) return Number(value.poolE) || 0
            if (value?.value !== undefined) return Number(value.value) || 0
            if (value?.rank !== undefined) return Number(value.rank ?? 0) + Number(value.mod ?? 0) + Number(value.augment ?? 0)
            if (value?.base !== undefined) return Number(value.base) + Number(value.mod ?? 0) + Number(value.augment ?? 0)
            return Number(value) || 0
        }

        #skillPool(skill) {
            if (skill?.pool !== undefined) return Number(skill.pool) || 0
            if (skill?.poolS !== undefined) return Number(skill.poolS) || 0
            if (skill?.poolE !== undefined) return Number(skill.poolE) || 0
            if (skill?.rank !== undefined) return Number(skill.rank ?? 0) + Number(skill.mod ?? 0) + Number(skill.augment ?? 0)
            return Number(skill?.points ?? 0) + Number(skill?.modifier ?? 0) + Number(skill?.augment ?? 0)
        }

        #attributeValue(attributeId) {
            const mapped = this.#v2AttributeId(attributeId)
            return this.#systemProperty(`attributes.${attributeId}`)
                ?? (mapped ? this.#systemProperty(`attributes.${mapped}`) : undefined)
        }

        #skillById(skillId) {
            return this.#systemProperty(`skills.${skillId}`)
        }

        #systemProperty(path) {
            try {
                if (typeof this.actor?.getSystemProperty === 'function') {
                    const value = this.actor.getSystemProperty(path)
                    if (value !== undefined) return value
                }
            } catch { }

            return foundry.utils.getProperty(this.actor?.system ?? {}, path)
        }

        #v2AttributeId(attributeId) {
            return game.sr6?.config?.ATTRIBUTE_TO_V2?.[attributeId]
                ?? CONFIG.SR6?.ATTRIBUTE_TO_V2?.[attributeId]
        }

        #skillSpecializations(skill) {
            const specializations = new Set()
            if (skill?.specialization) specializations.add(skill.specialization)
            if (skill?.expertise) specializations.add(skill.expertise)
            for (const expanded of skill?.expandedSpecializations ?? []) {
                if (typeof expanded === 'string') specializations.add(expanded)
                else if (expanded?.id) specializations.add(expanded.id)
                else if (expanded?.name) specializations.add(expanded.name)
            }
            return [...specializations]
        }

        #itemGroupId(item) {
            switch (item.type) {
                case 'quality':
                    return 'qualities'
                case 'spell':
                    return 'spells'
                case 'ritual':
                    return 'rituals'
                case 'adeptpower':
                case 'critterpower':
                    return 'powers'
                case 'complexform':
                case 'spritepower':
                case 'echo':
                    return 'resonance'
                case 'gear':
                    return this.#gearGroupId(item)
                default:
                    return this.displayPassiveItems ? 'gear' : null
            }
        }

        #gearGroupId(item) {
            const gearType = item.system?.type ?? ''
            const subtype = item.system?.subtype ?? ''
            if (gearType.startsWith('WEAPON_')) return 'weapons'
            if (gearType === 'ARMOR' || Number(item.system?.defense ?? 0) > 0) return 'armor'
            if (['CYBERWARE', 'BIOWARE'].includes(gearType) || subtype.includes('CYBERWARE') || subtype.includes('BIOWARE')) return 'augmentations'
            return 'gear'
        }

        #isRollableItem(item) {
            if (item.type === 'spell' || item.type === 'ritual' || item.type === 'complexform' || item.type === 'spritepower') return true
            return Boolean(item.system?.skill)
        }

        #canReload(item) {
            return Number(item.system?.ammocap ?? 0) > 0
                && Number(item.system?.ammocount ?? 0) < Number(item.system?.ammocap ?? 0)
        }

        #isMatrixActionAvailable(_actionId, action) {
            if (!action?.skill) return false
            if (this.#matrixPool(action) <= 0) return false

            if (action.linkedAttr === null || action.linkedAttr === undefined) return true
            return this.#matrixAttributePool(action.linkedAttr) > 0
        }

        #matrixAttributePool(attributeId) {
            try {
                if (typeof this.actor?.getMatrixPool === 'function') {
                    const pool = Number(this.actor.getMatrixPool(attributeId) ?? 0)
                    if (Number.isFinite(pool)) return pool
                }
            } catch { }

            const mapped = this.#v2AttributeId(attributeId)
            const legacy = this.actor?.system?.persona?.used?.[attributeId]
            if (legacy !== undefined) return Number(legacy) || 0

            return this.#pool(foundry.utils.getProperty(this.actor?.system ?? {}, `matrix.attributes.${mapped}`))
        }

        #matrixPool(action) {
            if (!action?.skill) return 0
            try {
                if (typeof this.actor?._getSkillPool === 'function') {
                    let attrib = action.attrib
                    if (this.actor?.system instanceof foundry.abstract.DataModel) attrib = this.#v2AttributeId(attrib) ?? attrib
                    const attributePath = attrib ? `system.attributes.${attrib}.pool` : undefined
                    return this.actor._getSkillPool(action.skill, action.specialization, attributePath)
                }
            } catch {
                return 0
            }

            return this.#skillPool(this.#skillById(action.skill))
        }

        #humanize(value) {
            return String(value ?? '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase())
        }
    }
})
