#!/bin/sh
#
# Updates the downloaded emoji. Execute this from the root directory.
#
# Syntax: scripts/downloadEmojiImages.sh emojiDataSourceVersion
# emojiDataSourceVersion – selects the version from npm, e.g. "latest" or a version number
#
# URL from:
# https://github.com/missive/emoji-mart/blob/16978d04a766eec6455e2e8bb21cd8dc0b3c7436/packages/emoji-mart/src/components/Emoji/Emoji.tsx#L35

# hardcoded
USER_AGENT="awesome-emoji-picker browser add-on build script (https://github.com/rugk/awesome-emoji-picker)"
SHEET_SIZE="64" # px emojis
EMOJI_SETS="apple google twitter facebook"
STORAGE_DIRECTORY="./src/popup/img/emoji-images"

# default
emojiDataSourceVersion="15.0.1"
test -n "$1" && emojiDataSourceVersion="$1" && echo "Using version $emojiDataSourceVersion for emoji-datasource."

for set in $EMOJI_SETS; do
    url="https://cdn.jsdelivr.net/npm/emoji-datasource-${set}@${emojiDataSourceVersion}/img/${set}/sheets-256/${SHEET_SIZE}.png"
    output="$STORAGE_DIRECTORY/${set}-${SHEET_SIZE}.png"
    echo "Downloading \"$url\" to \"${output}\"…"
    wget --user-agent "$USER_AGENT" \
        "$url" \
        -O "$output";
done
