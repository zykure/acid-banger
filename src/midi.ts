/*
  Copyright 2022 Jan Behrens
  This work is licensed under a Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
*/

import {FullNote, textNoteToNumber} from "./audio.js";

export function Midi(midiAccess: any, noteLength: number = 100) {
    function listInputsAndOutputs() {
        for (var entry of midiAccess.inputs) {
            var input = entry[1];
            console.log( "Input port [type:'" + input.type + "'] id:'" + input.id +
                "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
                "' version:'" + input.version + "'" );
        }

        for (var entry of midiAccess.outputs) {
            var output = entry[1];
            console.log( "Output port [type:'" + output.type + "'] id:'" + output.id +
                "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
                "' version:'" + output.version + "'" );
        }
    }

    function getOutputNames(): string[] {
        var devices: string[] = [];
        devices.push("(None)");

        for (var entry of midiAccess.outputs) {
            var output = entry[1];
            devices.push(output.manufacturer + " " + output.name);
        }
        return devices;
    }

    function getOutput(portID: string | number) {
        if (typeof(portID) === 'number') {
            if (portID == 0)
                return null;
            var key = Array.from(midiAccess.outputs.keys())[portID-1];
            return midiAccess.outputs.get(key);
        }
        else {
            return midiAccess.outputs.get(portID);
        }
    }

    function OutputDevice(portID: string | number) {
        function noteOn(note: FullNote | number, accent: boolean = false, glide: boolean = false, offset: number = 0) {
            var midiNote = typeof(note) === 'number' ? note : textNoteToNumber(note);
            midiNote += offset;
            var midiLength = glide ? noteLength : noteLength / 2;
            var noteOnMessage = [0x90, midiNote, accent ? 0x7f : 0x5f];
            var noteOffMessage = [0x80, midiNote, 0x40];
            var output = getOutput(portID);
            if (output) {
                // TODO: fix note length
                //console.log("Sending MIDI message: ", noteOnMessage, noteOffMessage)
                output.send( noteOnMessage );
                //output.send( noteOffMessage, window.performance.now() + midiLength );
            }
        }

        function noteOff(note: FullNote | number, offset: number = 0) {
            var midiNote = typeof(note) === 'number' ? note : textNoteToNumber(note);
            midiNote += offset;
            var noteOffMessage = [0x80, midiNote, 0x40];
            var output = getOutput(portID);
            if (output) {
                //console.log("Sending MIDI message: ", noteOffMessage)
                output.send( noteOffMessage );
            }
        }

        function controlChange(control: number, value: number) {
            var controlChangeMessage = [0xB0, control, value];
            var output = getOutput(portID);
            if (output) {
                //console.log("Sending MIDI message: ", controlChangeMessage)
                output.send( controlChangeMessage );
            }
        }

        function clockPulse() {
            var clockMessage = [0xF8];
            var output = getOutput(portID);
            if (output) {
                //console.log("Sending MIDI message: ", clockMessage)
                output.send([0xF8]);
            }
        }

        return {
            noteOn,
            noteOff,
            controlChange,
            clockPulse
        }
    }

    return {
        noteLength,
        listInputsAndOutputs,
        getOutputNames,
        getOutput,
        OutputDevice
    }
}

export type MidiT = ReturnType<typeof Midi>
