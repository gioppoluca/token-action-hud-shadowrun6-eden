import { ACTION_TYPE, ATTRIBUTE_IDS, DEFENSE_ACTIONS, DERIVED_ACTIONS, MATRIX_ACCESS_ACTIONS, RESISTANCE_ACTIONS } from './constants.js'
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
            this.#buildMatrixAccessActions()
            this.#buildUtilityActions()
        }

        #buildMultipleTokenActions() {
            this.#buildUtilityActions()
        }

        #buildAttributes() {
            const attributes = this.actor?.system?.attributes ?? {}
            const actions = ATTRIBUTE_IDS
                .filter(attributeId => attributes[attributeId])
                .filter(attributeId => this.#shouldShowAttribute(attributeId, attributes[attributeId]))
                .map(attributeId => {
                    const name = this.#attributeName(attributeId)
                    return {
                        id: attributeId,
                        name: this.#nameWithPool(name, attributes[attributeId]),
                        listName: this.#listName('attribute', name),
                        encodedValue: ['attribute', attributeId].join(this.delimiter)
                    }
                })

            this.addActions(actions, { id: 'attributes', type: 'system' })
        }


        #buildDerivedActions() {
            const derived = this.actor?.system?.derived ?? {}
            const actions = DERIVED_ACTIONS
                .filter(rollId => derived[rollId])
                .map(rollId => {
                    const name = Utils.localize(`shadowrun6.derived.${rollId}`, this.#humanize(rollId))
                    return {
                        id: rollId,
                        name: this.#nameWithPool(name, derived[rollId]),
                        listName: this.#listName('derived', name),
                        encodedValue: ['derived', rollId].join(this.delimiter)
                    }
                })

            this.addActions(actions, { id: 'derived', type: 'system' })
        }

        #buildSkills() {
            const skills = this.actor?.system?.skills ?? {}
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
            const defensePool = this.actor?.system?.defensepool ?? {}
            const actions = DEFENSE_ACTIONS
                .filter(action => defensePool[action.id])
                .map(action => {
                    const name = coreModule.api.Utils.i18n(action.name)
                    return {
                        id: action.id,
                        name: this.#nameWithPool(name, defensePool[action.id]),
                        listName: this.#listName('defense', name),
                        encodedValue: ['defense', action.defendWith].join(this.delimiter)
                    }
                })

            this.addActions(actions, { id: 'defense', type: 'system' })
        }

        #buildResistanceActions() {
            const defensePool = this.actor?.system?.defensepool ?? {}
            const actions = RESISTANCE_ACTIONS
                .filter(action => defensePool[action.id])
                .map(action => {
                    const name = coreModule.api.Utils.i18n(action.name)
                    return {
                        id: action.id,
                        name: this.#nameWithPool(name, defensePool[action.id]),
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

        #buildMatrixAccessActions() {
            if (!this.actor?.system?.persona && !this.actor?.system?.matrix) return

            const currentAccess = this.#matrixAccessLevel()
            const actions = MATRIX_ACCESS_ACTIONS.map(action => {
                const name = coreModule.api.Utils.i18n(action.name)
                const displayName = action.id === currentAccess ? `✓ ${name}` : name
                return {
                    id: action.id,
                    name: displayName,
                    listName: this.#listName('matrixAccess', name),
                    encodedValue: ['matrixAccess', action.id].join(this.delimiter)
                }
            })

            this.addActions(actions, { id: 'matrixAccess', type: 'system' })
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
            if (value?.value !== undefined) return Number(value.value) || 0
            if (value?.base !== undefined) return Number(value.base) + Number(value.mod ?? 0) + Number(value.augment ?? 0)
            return Number(value) || 0
        }

        #skillPool(skill) {
            if (skill?.pool !== undefined) return Number(skill.pool) || 0
            return Number(skill?.points ?? 0) + Number(skill?.modifier ?? 0) + Number(skill?.augment ?? 0)
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
            if (item.type === 'spell' || item.type === 'ritual' || item.type === 'complexform') return true
            return Boolean(item.system?.skill)
        }

        #canReload(item) {
            return Number(item.system?.ammocap ?? 0) > 0
                && Number(item.system?.ammocount ?? 0) < Number(item.system?.ammocap ?? 0)
        }

        #isMatrixActionAvailable(_actionId, action) {
            if (!action?.skill) return false
            if (!this.#matrixAccessAllows(action)) return false
            if (action.skill === 'cracking' && this.#skillPool(this.actor.system?.skills?.cracking) <= 0) return false

            if (action.linkedAttr === null || action.linkedAttr === undefined) return true
            const used = this.actor.system?.persona?.used ?? {}
            if (action.linkedAttr === 'a' && Number(used.a ?? 0) > 0) return true
            if (action.linkedAttr === 's' && Number(used.s ?? 0) > 0) return true
            return false
        }

        #matrixAccessAllows(action) {
            const access = this.#matrixAccessLevel()
            if (access === 'admin') return Boolean(action.admin)
            if (access === 'user') return Boolean(action.user)
            return Boolean(action.outsider)
        }

        #matrixAccessLevel() {
            return this.actor?.getFlag?.('shadowrun6-eden', 'matrix-access') ?? 'outsider'
        }

        #matrixPool(action) {
            if (!action?.skill) return 0
            try {
                if (typeof this.actor?._getSkillPool === 'function') {
                    return this.actor._getSkillPool(action.skill, action.specialization, action.attrib)
                }
            } catch {
                return 0
            }
            return this.#skillPool(this.actor?.system?.skills?.[action.skill])
        }

        #humanize(value) {
            return String(value ?? '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase())
        }
    }
})
