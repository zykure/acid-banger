# Spicy Endless Acid Banger

An algorithmic human-computer techno jam - now even more spicy

![Screenshot](https://github.com/zykure/acid-banger/blob/main/preview.png?raw=true)

Built in Typescript with the WebAudio API.

Live version running at [**zykure.github.io/acid-banger**](https://zykure.github.io/acid-banger/)

Many thanks to [vitling](https://music.vitling.xyz) for creating this awesome project! Please consider supporting his work (see below)

## Dependencies

This webapp is written in Typescript and needs additional packages for WebMIDI support.

On an Ubuntu system, install the depdencies by running the command:
```
sudo apt install -y npm node-typescript webpack
```

Then, execute the `build.sh` script to produce the output files in the `./dist` directory.

## Testing

To run this webapp locally, you need a webserver that can serve static files. An easy solution is Nginx.

A basic setup (on Ubuntu) can be configured by running the following commands in your source directory:
```
sudo apt install -y nginx

# Create server directory
sudo mkdir /var/www/html/acid-banger
sudo chown $USER:$USER /var/www/html/acid-banger

# Link server directory to source repository
ln -s /var/www/html/acid-banger ./dist
```

This should enable you to run the `build.sh` script and automatically update the webserver files. The webapp is then available at http://localhost/acid-banger/ with default Nginx settings.

(If the `./dist` directory already exists, you need to move or rename it beforehand.)


## Features

* Two software "Three-Oh" synthesizers (square and sawtooth waveforms)
  * Controllable parameters: Filter Cutoff, Filter Resonance, Envelope Mod, Decay Time, Distortion
  * 16-step sequencer with auto-generated patterns
  * Automatically controlled parameters (for those sweet filter sweeps)
* One software "Nine-Oh" drum machine
  * Mute-able drum sounds: Bass Drum, Open Hi-hat, Closed Hi-hat, Snare Drum, Clap
  * 16-step sequencer with auto-generated patterns
  * Automatically muted/unmuted drum sounds (to spice up the mix)
* Autopilot feature recreates filter patterns, moves parameter knobs, mutes drum parts
* Effects section with software delay
  * Delay Time is synced to BPM with 3/4 note length
  * Controllable parameters: Delay mix (dry/wet), Delay Feedback
* Software clock device with user controlled BPM
* Audio analysis section with oscilloscope and frequency spectrum
* MIDI interface
  * Thanks to WebMIDI, you can control hardware symths with this software
  * Each software instrument can control its own MIDI device
  * The pitch can be changed for each instrument (in semitones)
  * MIDI control messages are supported for the instrument's parameters (e.g. cutoff)
  * Additional MIDI control messages can be sent for "trigger" events
    * You can use this to enable/disable different waveforms on your synth, very useful when routing multiple instruments to one external synth
    * _Hint: set Trigger CC to control different VCO mix knobs on your synth for each instrument, this will turn on/off voices as needed_


## Support vitling

You can support vitling's work by [Sponsoring on GitHub](https://github.com/sponsors/vitling) or [buying](https://music.vitling.xyz) [music](https://edgenetwork.bandcamp.com/album/edge001-spaceport-lounge-music)

## License & Intended use

This is an art project, not a software tool for music creation. I consider it to be finished, and as such I will likely not be accepting feature requests or feature-driven PRs. Please feel encouraged to fork the project and do something else with it if you would like - I love to see further creative work built on top of it.

This work is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/). I am aware that this is an unusual choice for code, but it reflects its status as an art project. IANAL, so I'm not sure how this stands up legally, but in my mind this is an infinite interactive composition and as such it should be licensed like music or other creative works.

This means you can use the ideas and/or the code and/or the music output in derivative works, but you must give credit to the original source (ie. me and this project).
