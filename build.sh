#!/usr/bin/env bash

mkdir -p dist
tsc -p .
webpack ./js/app.js -o dist/ --mode production
cp -r index.html samples/ ui.css preview.png dist/
