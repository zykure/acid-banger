/*
  Copyright 2021 David Whiting
  This work is licensed under a Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
*/

import {FullNote, midiNoteToText} from "./audio.js";
import {choose, rndInt} from "./math.js";
import {
    GeneralisedParameter,
    genericParameter,
    NoteGenerator,
    parameter,
    Pattern,
    Slot,
    trigger,
    Trigger
} from "./interface.js";


export function ThreeOhGen(): NoteGenerator {

    let noteSet: GeneralisedParameter<FullNote[]> = genericParameter("note set", ['C1']);
    let newNotes: Trigger = trigger("new note set", true);
    const density = 1.0;

    const offsetChoices = [
        [0,0,12,24,27],
        [0,0,0,12,10,19,26,27],
        [0,1,7,10,12,13],
        [0],
        [0,0,0,12],
        [0,0,12,14,15,19],
        [0,0,0,0,12,13,16,19,22,24,25],
        [0,0,0,7,12,15,17,20,24],
    ];

    function changeNotes() {
        const root = rndInt(15) + 16;
        const offsets: number[] = choose(offsetChoices);
        noteSet.value = offsets.map(o => midiNoteToText(o + root));
    }

    function createPattern(): Pattern {
        if (newNotes.value == true) {
            changeNotes();
            newNotes.value = false;
        }
        const pattern: Slot[] = [];

        for (let i = 0; i < 16; i++) {
            const chance = density * (i % 4 === 0 ? 0.6 : (i % 3 === 0 ? 0.5 : (i % 2 === 0 ? 0.3 : 0.1)));
            if (Math.random() < chance) {
                pattern.push({
                    note: choose(noteSet.value),
                    accent: Math.random() < 0.3,
                    glide: Math.random() < 0.1
                })
            } else {
                pattern.push({
                    note: "-",
                    accent: false,
                    glide: false
                })
            }
        }

        return pattern;
    }
    return {
        createPattern,
        newNotes,
        noteSet
    }
}

export function NineOhGen() {
    function createPatterns(full: boolean = false) {
        const bdPattern: number[] = new Array(16);
        const ohPattern: number[] = new Array(16);
        const chPattern: number[] = new Array(16);
        const sdPattern: number[] = new Array(16);
        const cpPattern: number[] = new Array(16);
        const kickMode: string = choose(["electro", "fourfloor"]);
        const hatMode: string = choose(["offbeats", "closed", full ? "offbeats" : "none"]);
        const snareMode: string = choose(["backbeat","skip", full ? "backbeat" : "none"]);
        const clapMode: string = choose(["backbeat", "skip", full ? "backbeat" : "none"]);

        if (kickMode == "fourfloor") {
            for (let i = 0; i < 16; i++) {
                if (i % 4 == 0) {
                    bdPattern[i] = 0.9;
                } else if (i % 2 == 0 && Math.random() < 0.1) {
                    bdPattern[i] = 0.6;
                }
            }
        } else if (kickMode == "electro") {
            for (let i = 0; i < 16; i++) {
                if (i == 0) {
                    bdPattern[i] = 1;
                } else if (i % 2 == 0 && i % 8 != 4 && Math.random() < 0.5) {
                    bdPattern[i] = Math.random() * 0.9;
                } else if (Math.random() < 0.05) {
                    bdPattern[i] = Math.random() * 0.9;
                }
            }
        }

        if (snareMode == "backbeat") {
            for (let i = 0; i < 16; i++) {
                if (i % 8 === 4) {
                    sdPattern[i] = 1;
                }
            }
        } else if (snareMode == "skip") {
            for (let i = 0; i < 16; i++) {
                if (i % 8 === 3 || i % 8 === 6) {
                    sdPattern[i] = 0.6 + Math.random() * 0.4;
                } else if (i % 2 === 0 && Math.random() < 0.2) {
                    sdPattern[i] = 0.4 + Math.random() * 0.2;
                } else if (Math.random() < 0.1) {
                    sdPattern[i] = 0.2 + Math.random() * 0.2;
                }
            }
        }

        if (clapMode == "backbeat") {
            for (let i = 0; i < 16; i++) {
                if (i % 8 === 4) {
                    cpPattern[i] = 0.5;
                } else if (i % 8 == 5 && sdPattern[i-1]) {
                    cpPattern[i] = 0.3 + Math.random() * 0.2;
                }
            }
        } else if (clapMode == "skip") {
            for (let i = 0; i < 16; i++) {
                if (i % 8 === 3 || i % 8 === 6) {
                    cpPattern[i] = 0.5 + Math.random() * 0.3;
                } else if ((i % 8 === 4 || i % 8 === 7) && cpPattern[i-1] && Math.random() < 0.5) {
                    cpPattern[i] = 0.3 + Math.random() * 0.2;
                } else if (i % 2 === 0 && Math.random() < (sdPattern[i] ? 0.2 : 0.4)) {
                    cpPattern[i] = 0.4 + Math.random() * 0.1;
                } else if (Math.random() < 0.1) {
                    cpPattern[i] = 0.1 + Math.random() * 0.1;
                }
            }
        }

        if (hatMode == "offbeats") {
            for (let i = 0; i < 16; i++) {
                if (i % 4 == 2) {
                    ohPattern[i] = 0.4;
                } else if (Math.random() < 0.3) {
                    if (Math.random() < 0.5) {
                        chPattern[i] = Math.random() * 0.2;
                    } else {
                        ohPattern[i] = Math.random() * 0.2;
                    }
                }

            }
        } else if (hatMode == "closed") {
            for (let i = 0; i < 16; i++) {
                if (i % 2 === 0) {
                    chPattern[i] = 0.4;
                } else if (Math.random() < 0.5) {
                    chPattern[i] = Math.random() * 0.3;
                }

            }
        }

        return [bdPattern,ohPattern,chPattern,sdPattern,cpPattern]
    }
    return {
        createPatterns
    }
}
