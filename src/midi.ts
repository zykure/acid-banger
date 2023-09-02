/*
  Copyright 2022 Jan Behrens
  This work is licensed under a Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
*/

import {NumericParameter} from "./interface.js";
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
            //devices.push(output.manufacturer + " " + output.name);
            devices.push(output.name);
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

    function startClock(bpm: NumericParameter) {
        for (var entry of midiAccess.outputs) {
            var output = entry[1];
            output.send([0xF8]);  // clock signal
        }
        window.setTimeout(startClock, (60000/bpm.value)*(1/24));
    }

    function OutputDevice(portID: string | number, midiCh: number) {
        function noteOn(note: FullNote | number, velocity: number = 100, length: number = 100, offset: number = 0) {
            if (note < 0)
                return;
            const midiNote = typeof(note) === 'number' ? note + 60 - 12 : textNoteToNumber(note);  // number is relative to C0
            const noteOnMessage = [0x90 + midiCh, midiNote + offset, velocity];
            const noteOffMessage = [0x80 + midiCh, midiNote + offset, 0x40];
            var output = getOutput(portID);
            if (output) {
                //console.log("Sending MIDI message: ", noteOnMessage);
                output.send( noteOnMessage );
                output.send( noteOffMessage, window.performance.now() + length );
            }
        }

        function noteOff(note: FullNote | number, offset: number = 0) {
            if (note < 0)
                return;
            var midiNote = typeof(note) === 'number' ? note + 60 - 12 : textNoteToNumber(note);  // number is relative to C0 
            midiNote += offset;
            const noteOffMessage = [0x80 + midiCh, midiNote, 0x40];
            var output = getOutput(portID);
            if (output) {
                //console.log("Sending MIDI message: ", noteOffMessage);
                output.send( noteOffMessage );
            }
        }

        function allNotesOff() {
            const notesOffMessage = [0x07B, 0];
            var output = getOutput(portID);
            if (output) {
                //console.log("Sending MIDI message: ", allNotesOff);
                output.send(allNotesOff)
            }
        }

        function controlChange(channel: number, value: number, minValue: number = 32, maxValue: number = 96) {
            if (channel < 0)
                return;
			value = Math.max(minValue, value);
			value = Math.min(maxValue, value);
            const controlChangeMessage = [0xB0 + midiCh, channel, value];
            var output = getOutput(portID);
            if (output) {
                //console.log("Sending MIDI message: ", controlChangeMessage);
                output.send( controlChangeMessage );
            }
        }

        // function clockPulse() {
        //     const clockMessage = [0xF8];
        //     var output = getOutput(portID);
        //     if (output) {
        //         //console.log("Sending MIDI message: ", clockMessage.toString(16))
        //         output.send(clockMessage);
        //     }
        // }

        return {
            noteOn,
            noteOff,
            allNotesOff,
            controlChange,
            // clockPulse
        }
    }

    return {
        noteLength,
        listInputsAndOutputs,
        getOutputNames,
        getOutput,
        OutputDevice,
        startClock,
    }
}

export type MidiT = ReturnType<typeof Midi>
