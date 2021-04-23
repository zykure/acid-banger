#!/usr/bin/env bash

mkdir -p ./dist
tsc -p .
webpack ./js/app.js -o ./dist/ --mode production
cp -r index.html ui.css preview.png js/ samples/ ./dist/
