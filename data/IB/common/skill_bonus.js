/*
TODO: this can be a json file when done

Classes:
    0: Base attack bonus
    1: Base attack mult
    2: Attack bonus
    3: Post-cap Attack mult
    
    4: Affinity bonus
    5: Set crit dmg

    6: Base ele mult (percentage) {Pass element id as extra parameter here}
    7: Ele bonus {Pass element id as extra parameter here}
    8: Ele bonus (always 10) {Pass element id as extra parameter here} <- this is used in the status attack skills
    9: Pre-cap ele mult
    10: Post-cap ele mult

    11: Set ele crit dmg
*/

export const skill_bonus = {
    19: [ // Attack boost
        {   
            effects: [
            {
                class: 2, 
                param: 1
            },
            {
                class: 4,
                param: 2
            }
            ]
        }
    ],
    30: [ // Fire attack
        {   
            effects: [
            {
                class: 7, 
                param: 1,
                extra: 0
            },
            {
                class: 6,
                param: 2,
                extra: 0
            }
            ]
        }
    ],
    31: [ // Water attack
        {   
            effects: [
            {
                class: 7, 
                param: 1,
                extra: 1
            },
            {
                class: 6,
                param: 2,
                extra: 1
            }
            ]
        }
    ],
    32: [ // Ice attack
        {   
            effects: [
            {
                class: 7, 
                param: 1,
                extra: 2
            },
            {
                class: 6,
                param: 2,
                extra: 2
            }
            ]
        }
    ],
    33: [ // Thunder attack
        {   
            effects: [
            {
                class: 7, 
                param: 1,
                extra: 3
            },
            {
                class: 6,
                param: 2,
                extra: 3
            }
            ]
        }
    ],
    34: [ // Dragon attack
        {   
            effects: [
            {
                class: 7, 
                param: 1,
                extra: 4
            },
            {
                class: 6,
                param: 2,
                extra: 4
            }
            ]
        }
    ],
    35: [ // Poison attack
        {   
            effects: [
            {
                class: 8, 
                param: 0,
                extra: 5
            },
            {
                class: 6,
                param: 1,
                extra: 5
            }
            ]
        }
    ],
    36: [ // Paralysis attack
        {   
            effects: [
            {
                class: 8, 
                param: 0,
                extra: 6
            },
            {
                class: 6,
                param: 1,
                extra: 6
            }
            ]
        }
    ],
    37: [ // Sleep attack
        {   
            effects: [
            {
                class: 8, 
                param: 0,
                extra: 7
            },
            {
                class: 6,
                param: 1,
                extra: 7
            }
            ]
        }
    ],
    38: [ // Blast attack
        {   
            effects: [
            {
                class: 8, 
                param: 0,
                extra: 8
            },
            {
                class: 6,
                param: 1,
                extra: 8
            }
            ]
        }
    ],
    48: [ // Critical eye
        {   
            effects: [
            {
                class: 4, 
                param: 1
            }
            ]
        }
    ],
    49: [ // Critical boost
        {   
            effects: [
            {
                class: 5, 
                param: 1
            }
            ]
        }
    ],
}