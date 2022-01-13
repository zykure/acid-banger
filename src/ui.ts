/*
  Copyright 2021 David Whiting
  This work is licensed under a Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
*/

import {
    DelayUnit,
    DrumPattern,
    GeneralisedParameter, ClockUnit, NineOhMachine, NoteGenerator,
    NumericParameter,
    PatternParameter, ProgramState,
    ThreeOhMachine, Trigger, AutoPilotUnit
} from "./interface.js";
import {textNoteToNumber} from "./audio.js";
import {MidiT} from "./midi.js";
import {Dial, RangeSelect} from "./dial.js";
import {midiControlPresets, midiDrumPresets} from "./app.js";

const defaultColors = {
    bg: "#222266",
    note: "#88aacc",
    accent: "#AA88CC",
    glide: "#CCAA88",
    text: "#CCCCFF",
    highlight: "rgba(255,255,255,0.2)",
    grid1: "rgba(255,255,255,0.1)",
    grid2: "rgba(255,255,255,0.3)",
    dial: "#AA88CC"
}
type ColorScheme = { [color in keyof typeof defaultColors]: string; };


function DialSet(parameters: {[key: string]: NumericParameter} | NumericParameter[], ...classes: string[]) {
    const params = Array.isArray(parameters) ? parameters : Object.keys(parameters).map(k => parameters[k]);

    const container = document.createElement("div");
    container.classList.add("params", ...classes);

    params.forEach(param => {
        //const param = parameters[p];
        const dial = Dial(param.value, param.bounds, param.name, defaultColors.dial, defaultColors.text);

        // Change the parameter if we move the dial
        dial.bind(v => { param.value = v });

        // Move the dial if the parameter changes elsewhere
        param.subscribe(v => dial.value = v);

        container.append(dial.element);
    })

    return container;
}

function MidiControls(midiDevice: NumericParameter, deviceNames: string[], midiPreset: NumericParameter, presetNames: string[],
                      parameters: {[key: string]: NumericParameter} | NumericParameter[], ...classes: string[]) {
    const params = Array.isArray(parameters) ? parameters : Object.keys(parameters).map(k => parameters[k]);

    const container = document.createElement("div");
    container.classList.add("midi-controls", "params", ...classes);

    const devices = optionList(midiDevice, deviceNames);
    container.append(devices);

    const presets = optionList(midiPreset, presetNames);
    container.append(presets);

    params.forEach(param => {
        const label = document.createElement("span");
        label.classList.add("param-name");
        label.append(document.createTextNode(param.name + ":"));

        container.append(label);

        const dial = RangeSelect(param.value, param.bounds, param.name);

        // Change the parameter if we move the dial
        dial.bind(v => { param.value = v });

        // Move the dial if the parameter changes elsewhere
        param.subscribe(v => dial.value = v);

        container.append(dial.element);
    })

    return container;
}

function triggerButton(target: Trigger) {
    const but = document.createElement("button");
    but.classList.add("trigger-button");
    but.innerText = "⟳";

    target.subscribe(v => {
        if (v) but.classList.add("waiting"); else but.classList.remove("waiting");
    });
    but.addEventListener("click", function () {
        target.value = true;
    })

    return but;
}

function toggleButton(param: GeneralisedParameter<boolean>, ...classes: string[]) {
    const but = document.createElement("button");
    but.classList.add(...classes);
    but.innerText = param.name;

    but.addEventListener("click", () => param.value = !param.value);
    param.subscribe(v => {
        if (v) {
            but.classList.add("on");
            but.classList.remove("off");
        } else {
            but.classList.add("off");
            but.classList.remove("on");
        }
    })

    return but;
}

function optionList(param: NumericParameter, options: string[]) {
    const sel = document.createElement("select");
    sel.classList.add("option-list");

    sel.addEventListener("click", () => param.value = sel.selectedIndex);

    for (let name of options) {
        var opt = document.createElement("option");
        opt.text = name;
        //opt.value = id;
        sel.add(opt);
    }

    return sel;
}

function label(text: string) {
    const element = document.createElement("div");
    element.classList.add("label");
    element.innerText = text;
    return element;
}

function machine(...contents: HTMLElement[]) {
    const element = document.createElement("div");
    element.classList.add("machine");
    element.append(...contents);
    return element
}

function controlGroup(label: HTMLElement, content: HTMLElement, ...classes: string[]) {
    const element = document.createElement("div");
    element.classList.add("control-group", ...classes);
    element.append(label, content);
    return element
}

function controls(...contents: HTMLElement[]) {
    const element = document.createElement("div");
    element.classList.add("controls");
    element.append(...contents);
    return element
}

function group(...contents: HTMLElement[]) {
    const element = document.createElement("div");
    element.classList.add("group");
    element.append(...contents);
    return element;
}


function PatternDisplay(patternParam: PatternParameter, stepParam: NumericParameter,  colors: ColorScheme = defaultColors) {
    const canvas = document.createElement("canvas");
    canvas.classList.add("pattern");
    function repaint() {
        const pattern = patternParam.value;
        const w = canvas.width = canvas.clientWidth;
        const h = canvas.height = 200;
        const vScale = h / 50;
        const g = canvas.getContext("2d") as CanvasRenderingContext2D;

        g.font = "10px Orbitron";

        g.fillStyle = colors.bg;
        g.fillRect(0, 0, w, h);

        for (let i = 0; i < pattern.length; i++) {
            g.strokeStyle = i % 4 == 0 ? colors.grid2 : colors.grid1;
            const x = w * i / pattern.length;
            g.beginPath();
            g.moveTo(x, 0);
            g.lineTo(x, h);
            g.stroke();
        }

        for (let i = 0; i < 80; i++) {
            g.strokeStyle = i % 12 == 0 ? colors.grid2 : colors.grid1;
            const y = h - (i * vScale);
            g.beginPath();
            g.moveTo(0, y);
            g.lineTo(w, y);
            g.stroke();
        }

        for (let i = 0; i < pattern.length; i++) {
            const s = pattern[i];
            if (s.note === "-") {
            } else {
                const n = textNoteToNumber(s.note) - 24;
                const x = w * i / pattern.length;
                const y = h - (n * vScale);
                const bw = w / pattern.length;
                const bh = 5;

                g.fillStyle = s.glide ? colors.glide : (s.accent ? colors.accent : colors.note);
                g.fillRect(x, y, bw, bh);

                g.fillStyle = colors.text;
                const xt = (x + bw / 2) - g.measureText(s.note).width / 2;
                g.fillText(s.note, xt, y);
            }
        }

        g.fillStyle = colors.highlight;
        g.fillRect(w * stepParam.value / pattern.length, 0, w / pattern.length, h);
    }

    patternParam.subscribe(repaint);
    stepParam.subscribe(repaint);

    return canvas;
}

function DrumDisplay(pattern: GeneralisedParameter<DrumPattern>, mutes: GeneralisedParameter<boolean>[], stepParam: NumericParameter, colors: ColorScheme = defaultColors) {
    const canvas = document.createElement("canvas");
    canvas.classList.add("pattern");

    function repaint() {
        const w = canvas.width = canvas.clientWidth;
        const h = canvas.height = 100;
        const g = canvas.getContext("2d") as CanvasRenderingContext2D;
        g.fillStyle = colors.bg;
        g.fillRect(0, 0, w, h);

        for (let i = 0; i < 16; i+=4) {
            g.strokeStyle = i % 4 == 0 ? colors.grid2 : colors.grid1;
            const x = w * i / 16;
            g.beginPath();
            g.moveTo(x, 0);
            g.lineTo(x, h);
            g.stroke();
        }

        for (let i = 0; i < 16; i++) {
            const x = w * i / 16;
            for (let p = 0; p < pattern.value.length; p++) {
                const y = (p / pattern.value.length) * h;
                if (pattern.value[p][i]) {
                    if (mutes[p].value) {
                        g.fillStyle = "rgba(128,0,0,0.4)";
                    } else {
                        g.fillStyle = "rgba(136,170,204," + pattern.value[p][i] + ")";
                    }
                    g.fillRect(x, y, w / 16, h / pattern.value.length);
                }
            }
        }

        g.fillStyle = colors.highlight;
        g.fillRect(w * stepParam.value / 16, 0, w / 16, h);
    }

    pattern.subscribe(repaint);
    stepParam.subscribe(repaint);

    return canvas;
}



function NoteGen(noteGenerator: NoteGenerator) {
    const currentNotes = document.createElement("div");
    currentNotes.classList.add("parameter-controlled", "notegen-note-display");
    noteGenerator.noteSet.subscribe(notes => {
        currentNotes.innerText = notes.join(", ");
    })

    return controlGroup(
        label("Notegen"),
        group(
            triggerButton(noteGenerator.newNotes),
            currentNotes
        ),
        "notegen-box"
    )
}

function Mutes(params: GeneralisedParameter<boolean>[]) {
    const container = document.createElement("div");
    container.classList.add("mutes");

    container.append(...params.map(p => toggleButton(p)));
    return container;
}

function DelayControls(delayUnit: DelayUnit) {
    const controls = DialSet([delayUnit.dryWet, delayUnit.feedback]);
    controls.classList.add("horizontal");

    return controlGroup(
        label("Delay"),
        controls,
    )
}

function AutopilotControls(autoPilot: AutoPilotUnit) {
    return controlGroup(
        label("Autopilot"),
        group(
            ...autoPilot.switches.map(p => toggleButton(p, "autopilot-button"))
        )
    )
}

function AudioMeter(analyser: AnalyserNode) {
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    let w = canvas.width = 200;
    const h = canvas.height = 50;
    const g = canvas.getContext("2d") as CanvasRenderingContext2D;

    const fftOutput = new Uint8Array(analyser.fftSize);
    const freqOutput = new Uint8Array(analyser.frequencyBinCount / 2);

    function draw() {
        //w = canvas.width = canvas.clientWidth;
        analyser.getByteTimeDomainData(fftOutput);
        analyser.getByteFrequencyData(freqOutput);

        g.clearRect(0,0,w,h);

        g.fillStyle = "white";
        for (let i =0 ; i < freqOutput.length; i++) {
            const v = freqOutput[i] / 256;
            g.fillStyle = 'rgb(' + (freqOutput[i]/2 + 128) + ',0,0)';
            g.fillRect(w * i/freqOutput.length, h - 1.0 * v * h, w/freqOutput.length, 1.0 * v * h);
        }

        g.strokeStyle = "white";
        g.beginPath();
        g.moveTo(0,h/2);
        for (let i =0 ; i < fftOutput.length; i++) {
            const v = (fftOutput[i] / 128) - 1;
            g.lineTo(w * i/fftOutput.length, h/2 + (1.5 * v * h/2));
        }
        g.stroke();

        window.requestAnimationFrame(draw);
    }
    window.requestAnimationFrame(draw);

    return canvas;
}


export function UI(state: ProgramState, autoPilot: AutoPilotUnit, analyser: AnalyserNode, midi: MidiT) {
    const ui = document.createElement("div");
    ui.id = "ui";

    const otherControls = controls(
        AutopilotControls(autoPilot),
        NoteGen(state.gen),
        DelayControls(state.delay),
        controlGroup(label("Clock"), DialSet([state.clock.bpm], "horizontal")),
        controlGroup(label("Meter"), group(AudioMeter(analyser)), "meter")
    )

    const machineContainer = document.createElement("div");
    machineContainer.classList.add("machines");

    const emptyElement = document.createElement("div");
    const deviceNames = midi ? midi.getOutputNames() : [];
    const notePresetNames = [...midiControlPresets.keys()];
    const drumPresetNames = [...midiDrumPresets.keys()];

    const noteMachines = state.notes.map((n, i) => machine(
        label("303-0" + (i+1)),
        group(
            triggerButton(n.newPattern),
            PatternDisplay(n.pattern, state.clock.currentStep),
            DialSet(n.parameters),
            midi ? MidiControls(n.midiDevice, deviceNames, n.midiPreset, notePresetNames, n.midiControls, "horizontal") : emptyElement,
        )
    ));

    const drumMachine = machine(
        label("909-XX"),
        group(
            triggerButton(state.drums.newPattern),
            DrumDisplay(state.drums.pattern, state.drums.mutes, state.clock.currentStep),
            Mutes(state.drums.mutes),
            midi ? MidiControls(state.drums.midiDevice, deviceNames, state.drums.midiPreset, drumPresetNames, state.drums.midiControls, "horizontal") : emptyElement,
        )
    )

    machineContainer.append(...noteMachines, drumMachine)
    ui.append(machineContainer, otherControls);

    return ui;
}
