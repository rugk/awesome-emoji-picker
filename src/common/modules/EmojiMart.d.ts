import type { Picker } from 'emoji-mart';

type ExtractProps<T> = {
  [K in keyof T]: T[K] extends { value: infer V } ? V : never;
};

type PickerPropsValues = ExtractProps<typeof Picker.Props>;
type EmojiPropsValues = ExtractProps<typeof Emoji.Props>;

