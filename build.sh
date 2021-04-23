#!/usr/bin/env bash

tsc -p . || exit $?
mkdir -p ./dist || exit $?
webpack ./js/app.js -o ./dist/ --mode production || exit $?
cp -r index.html ui.css preview.png js/ samples/ ./dist/ || exit $?
