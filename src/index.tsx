import { Alert as RNAlert, processColor, type ColorValue } from 'react-native';

import NativeRNAlert from './NativeRNAlert';

export type AlertButton = {
  /** Android: the last button is positive, the one before negative, the one before that neutral. */
  text?: string;
  onPress?: () => void;
  /** iOS: emphasized; on iOS 26, filled with the tint. */
  isPreferred?: boolean;
  style?: 'default' | 'cancel' | 'destructive';
};

export type AlertColors = {
  /** `default` buttons, and on iOS every non-destructive button and the prompt's cursor. */
  tintColor?: ColorValue;
  /** `cancel` buttons (Android only: iOS draws them in the tint). */
  labelColor?: ColorValue;
  /** `destructive` buttons (Android only: iOS keeps its system red). */
  destructiveColor?: ColorValue;
};

export type AlertOptions = AlertColors & {
  /** Android: whether back or a tap outside dismisses the alert. Defaults to false. */
  cancelable?: boolean;
  /** iOS: forces a light or dark alert. */
  userInterfaceStyle?: 'unspecified' | 'light' | 'dark';
  /** Android: called when the alert is dismissed without a button. */
  onDismiss?: () => void;
};

export type PromptOptions = AlertColors & {
  title: string;
  message?: string;
  defaultValue?: string;
  /** Android: the field's floating label. */
  label?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  cancelText?: string;
  confirmText?: string;
  /** Android: whether back or a tap outside dismisses the prompt. Defaults to true. */
  cancelable?: boolean;
  userInterfaceStyle?: 'unspecified' | 'light' | 'dark';
};

// Alerts are shown one at a time, in call order: a follow-up alert waits for the
// current one to close instead of replacing it.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task);
  // Keep the queue alive whatever a task or a callback does.
  queue = next.catch(() => undefined);
  return next;
}

/** `false` where the native module is missing (web, Expo Go). There, `alert` uses RN's `Alert`. */
export const isAvailable = NativeRNAlert != null;

const toColor = (color: ColorValue | undefined) =>
  color == null ? undefined : (processColor(color) as number);

/**
 * Drop-in replacement for `Alert.alert`: a UIAlertController on iOS and a Material 3
 * dialog on Android, with the buttons in your colors.
 */
export function alert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options: AlertOptions = {}
): void {
  const resolvedButtons: AlertButton[] = buttons?.length
    ? buttons
    : [{ text: 'OK' }];

  const onResult = (index: number) => {
    if (index >= 0) {
      resolvedButtons[index]?.onPress?.();
    } else {
      options.onDismiss?.();
    }
  };

  const showSystemAlert = () =>
    RNAlert.alert(title, message, resolvedButtons, options);
  if (!NativeRNAlert) {
    showSystemAlert();
    return;
  }

  const native = NativeRNAlert;
  enqueue(() =>
    native
      .alert({
        buttons: resolvedButtons.map((button) => ({
          isPreferred: button.isPreferred ?? false,
          style: button.style ?? 'default',
          text: button.text ?? '',
        })),
        cancelable: options.cancelable ?? false,
        destructiveColor: toColor(options.destructiveColor),
        labelColor: toColor(options.labelColor),
        message,
        tintColor: toColor(options.tintColor),
        title,
        userInterfaceStyle: options.userInterfaceStyle ?? 'unspecified',
      })
      .then(
        onResult,
        // Only a failure to *show* falls back to RN's alert: a throwing button
        // callback must not open the alert again.
        showSystemAlert
      )
  ).catch((error: unknown) => {
    console.error('[react-native-alert]', error);
  });
}

/**
 * A one-field text prompt with Cancel and Confirm. Resolves with the text as typed,
 * or `null` when it was cancelled.
 */
export function prompt({
  autoCapitalize = 'sentences',
  cancelable = true,
  cancelText = 'Cancel',
  confirmText = 'OK',
  defaultValue = '',
  label,
  labelColor,
  message,
  tintColor,
  title,
  userInterfaceStyle = 'unspecified',
}: PromptOptions): Promise<string | null> {
  const native = NativeRNAlert;
  if (!native) {
    return Promise.reject(
      new Error('react-native-alert: native module missing')
    );
  }
  return enqueue(() =>
    native.prompt({
      autoCapitalize,
      cancelable,
      cancelText,
      confirmText,
      defaultValue,
      label,
      labelColor: toColor(labelColor),
      message,
      tintColor: toColor(tintColor),
      title,
      userInterfaceStyle,
    })
  ).then(({ confirmed, text }) => (confirmed ? text : null));
}

export const Alert = { alert, prompt };
