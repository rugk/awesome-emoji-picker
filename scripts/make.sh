#!/bin/sh
#
# Makes a release ZIP of the add-on.
#
# IMPORTANT: This is only useful for building release versions of the add-on.
# For development, please rather follow the guidance in the contributing doc.
#

EXTENSION_NAME="awesome-emoji-picker@rugk.github.io"

mkdir -p "build"

# license should be in add-on
mv LICENSE.md src/LICENSE.md

browser="firefox"
[ -n "$1" ] && browser="$1" && echo "Using browser $browser"

# make sure we are using the stable manifest
# as the dev edition manifest.json allows mocha.css and mocha.js in the CSP
cp "./scripts/manifests/$browser.json" "./src/manifest.json" || exit

# create zip
cd src || exit
zip -r -FS "../build/${EXTENSION_NAME}_${browser}.zip" ./* -x "tests/*" -x "**/tests/*" \
    -x "docs/*" -x "**/docs/*" \
    -x "examples/*" -x "**/examples/*" -x "**/*.example" \
    -x "**/README.md" -x "**/CONTRIBUTING.md" -x "**/manifest.json" \
    -x "**/.git" -x "**/.gitignore" -x "**/.gitmodules"  -x "**/.gitkeep" \
    -x "**/.eslintrc" \
    -x "**/package.json" -x "**/package-lock.json" -x "**/webpack.config.js" \
    -x "node_modules/@emoji-mart/data/1/*" \
    -x "node_modules/@emoji-mart/data/sets/1/*" \
    -x "node_modules/@emoji-mart/data/2/*" \
    -x "node_modules/@emoji-mart/data/sets/2/*" \
    -x "node_modules/@emoji-mart/data/3/*" \
    -x "node_modules/@emoji-mart/data/sets/3/*" \
    -x "node_modules/@emoji-mart/data/4/*" \
    -x "node_modules/@emoji-mart/data/sets/4/*" \
    -x "node_modules/@emoji-mart/data/5/*" \
    -x "node_modules/@emoji-mart/data/sets/5/*" \
    -x "node_modules/@emoji-mart/data/11/*" \
    -x "node_modules/@emoji-mart/data/sets/11/*" \
    -x "node_modules/@emoji-mart/data/12/*" \
    -x "node_modules/@emoji-mart/data/sets/12/*" \
    -x "node_modules/@emoji-mart/data/12.1/*" \
    -x "node_modules/@emoji-mart/data/sets/12.1/*" \
    -x "node_modules/@emoji-mart/data/13/*" \
    -x "node_modules/@emoji-mart/data/sets/13/*" \
    -x "node_modules/@emoji-mart/data/13.1/*" \
    -x "node_modules/@emoji-mart/data/sets/13.1/*" \
    -x "node_modules/@emoji-mart/data/14/*" \
    -x "node_modules/@emoji-mart/data/sets/14/*" \
    -x "node_modules/@emoji-mart/data/15/all.json" \
    -x "node_modules/emoji-mart/dist/browser*" \
    -x "node_modules/emoji-mart/dist/index*" \
    -x "node_modules/emoji-mart/dist/main*" \
    -x "**/.editorconfig" \
    -x "**/*.d.ts" \
    -x "**/.github/*"

# revert changes
mv LICENSE.md ../LICENSE.md
cp "../scripts/manifests/dev.json" "../src/manifest.json"

cd ..
