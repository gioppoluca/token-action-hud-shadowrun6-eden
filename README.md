# Token Action HUD Shadowrun 6 Eden

Token Action HUD Shadowrun 6 Eden is a system module for [Token Action HUD Core](https://foundryvtt.com/packages/token-action-hud-core), adapted for the `shadowrun6-eden` Foundry VTT system.

## Features

- Attribute tests from `system.attributes`.
- Skill tests from `system.skills`, including actor specializations and expertise entries when present.
- Weapon and skill-based gear rolls through Shadowrun 6 Eden's native roll classes.
- Spell and ritual rolls through Shadowrun 6 Eden's native spell roll flow.
- Complex form and sprite power rolls through Shadowrun 6 Eden's resonance roll flow.
- Passive gear, qualities, augmentations, and other items can be sent to chat.
- Physical, spell, and matrix defense actions.
- Matrix actions are generated from `CONFIG.SR6.MATRIX_ACTIONS` when available.
- End Turn utility action.

## Requirements

- Foundry VTT v13-v14 module compatibility target.
- Shadowrun 6th Edition Eden system (`shadowrun6-eden`).
- Token Action HUD Core: 2.x

The current Shadowrun 6 Eden system release line is verified for Foundry v13, so actual runtime compatibility is ultimately limited by the installed SR6 Eden system version.

## Settings

- **Display Zero-Pool Skills**: shows skills with no dice pool.
- **Display Passive Items**: shows non-rollable/passive items such as qualities, augmentations, and general gear.

## Installation

