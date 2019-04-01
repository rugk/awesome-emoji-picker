#!/bin/sh
#
# Updates the downloaded emoji.
#
# Syntax: scripts/downloadEmojiImages.sh emojiDataSourceVersion
# emojiDataSourceVersion – selects the version from npm, e.g. "latest" or a version number
#

# hardcoded
USER_AGENT="awesome-emoji-picker browser add-on build script (https://github.com/rugk/awesome-emoji-picker)"
SHEET_SIZE="64" # px emojis
EMOJI_SETS="apple google twitter emojione messenger facebook"
STORAGE_DIRECTORY="./src/popup/img/emoji-images"

# default
emojiDataSourceVersion="4.0.4"
test -n "$1" && emojiDataSourceVersion="$1" && echo "Using version $emojiDataSourceVersion for emoji-datasource."

for set in $EMOJI_SETS; do
    wget --user-agent "$USER_AGENT" \
        "https://unpkg.com/emoji-datasource-${set}@${emojiDataSourceVersion}/img/${set}/sheets-256/${SHEET_SIZE}.png" \
        -O "$STORAGE_DIRECTORY/${set}-${SHEET_SIZE}.png";
done
