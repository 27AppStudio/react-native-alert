import { TurboModuleRegistry, type TurboModule } from 'react-native';

type Button = {
  isPreferred: boolean;
  /** `default`, `cancel` or `destructive`. */
  style: string;
  text: string;
};

// Colors are `processColor` values; a missing one keeps the platform default.
type AlertOptions = {
  buttons: Button[];
  cancelable: boolean;
  destructiveColor?: number;
  labelColor?: number;
  message?: string;
  tintColor?: number;
  title: string;
  /** `unspecified`, `light` or `dark` (iOS only). */
  userInterfaceStyle: string;
};

// Spelled out rather than `AlertOptions & {…}`: codegen reads each field.
type PromptOptions = {
  /** `none`, `sentences`, `words` or `characters`. */
  autoCapitalize: string;
  cancelable: boolean;
  cancelText: string;
  confirmText: string;
  defaultValue: string;
  /** The field's floating label (Android only). */
  label?: string;
  labelColor?: number;
  message?: string;
  tintColor?: number;
  title: string;
  userInterfaceStyle: string;
};

type PromptResult = {
  /** Whether the confirm button (or the keyboard's Done) closed the prompt. */
  confirmed: boolean;
  text: string;
};

export interface Spec extends TurboModule {
  /**
   * Shows a native alert and resolves with the index of the pressed button, or -1
   * when it was dismissed without one (Android back or outside tap).
   */
  alert(options: AlertOptions): Promise<number>;
  /**
   * An alert with one text field, prefilled and focused. Its confirm button is
   * disabled while the field is blank, and the keyboard's Done presses it.
   */
  prompt(options: PromptOptions): Promise<PromptResult>;
}

// Missing on web and in Expo Go: see `isAvailable`.
export default TurboModuleRegistry.get<Spec>('RNAlert');
