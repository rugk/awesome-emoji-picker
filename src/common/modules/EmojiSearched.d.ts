import { Emoji, Skin } from '@emoji-mart/data';

// workaround for missing complete types https://github.com/missive/emoji-mart/pull/996

export type SkinSearched = Skin & {
  shortcodes?: string;
};

export type EmojiSearched = Emoji & {
  search: string;
  skins: SkinSearched[]
};
