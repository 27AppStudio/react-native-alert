<h1><img src="docs/images/banner.svg" width="100%" alt="@27appstudio/react-native-alert by 27AppStudio"></h1>

<p>
  <a href="https://www.npmjs.com/package/@27appstudio/react-native-alert"><img src="https://img.shields.io/npm/v/@27appstudio/react-native-alert?label=npm&labelColor=0B0B0F&color=3340FF" alt="npm version"></a>
  <a href="https://github.com/27AppStudio/react-native-alert/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/27AppStudio/react-native-alert/ci.yml?branch=main&label=ci&labelColor=0B0B0F" alt="CI status"></a>
  <a href="#installation"><img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android-3340FF?labelColor=0B0B0F" alt="Platforms: iOS and Android"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-3340FF?labelColor=0B0B0F" alt="MIT license"></a>
</p>

Native alerts and text prompts for React Native, drawn by UIKit and Material 3 in your app's colors:

- **iOS**: `UIAlertController`, tinted. React Native's `Alert` always draws its buttons in the system blue. On iOS 26 the preferred button is filled with your tint, and gets a black label when the tint is light, so it stays readable in dark mode.
- **Android**: Material 3 dialogs (`MaterialAlertDialogBuilder`) instead of React Native's AppCompat ones. Default, cancel and destructive buttons each take their own color. The prompt is an outlined Material 3 text field in your tint.

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/hero-dark.png"><img src="docs/images/hero-light.png" width="720" alt="An iPhone showing an indigo Share this album? alert over a photo album, next to an Android phone showing an amber Rename note dialog over a notes list"></picture></p>

|          | iOS 26                                                                                                                                                                                                                                                                           | iOS 18                                                                                                                                                                                                                                              | Android                                                                                                                                                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `alert`  | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/ios26-album-dark.png"><img src="docs/images/ios26-album-light.png" width="220" alt="iOS 26: Share this album? alert over a photo album page, with a grey Cancel and an indigo filled Share"></picture> | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/ios18-album-dark.png"><img src="docs/images/ios18-album-light.png" width="220" alt="iOS 18: the same alert in the classic style, with indigo Cancel and Share"></picture> | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/android-album-dark.png"><img src="docs/images/android-album-light.png" width="220" alt="Android: Material 3 Share this album? dialog with an indigo Share"></picture>                          |
| `prompt` | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/ios26-notes-dark.png"><img src="docs/images/ios26-notes-light.png" width="220" alt="iOS 26: Rename note prompt over a notes list, with an amber filled Save"></picture>                                | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/ios18-notes-dark.png"><img src="docs/images/ios18-notes-light.png" width="220" alt="iOS 18: Rename note prompt with amber Cancel and Save"></picture>                     | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/android-notes-dark.png"><img src="docs/images/android-notes-light.png" width="220" alt="Android: Material 3 Rename note dialog with an amber outlined Name field and an amber Save"></picture> |

Photos by [Pietro De Grandi](https://unsplash.com/@peter_mc_greats?utm_source=27appstudio_showcase&utm_medium=referral), [Luca Bravo](https://unsplash.com/@lucabravo?utm_source=27appstudio_showcase&utm_medium=referral), [John Lee](https://unsplash.com/@john_artifexfilm?utm_source=27appstudio_showcase&utm_medium=referral), [Giammarco Boscaro](https://unsplash.com/@giamboscaro?utm_source=27appstudio_showcase&utm_medium=referral), [Cosmic Timetraveler](https://unsplash.com/@cosmictimetraveler?utm_source=27appstudio_showcase&utm_medium=referral), [Bruno Martins](https://unsplash.com/@brunus?utm_source=27appstudio_showcase&utm_medium=referral), [Brooke Lark](https://unsplash.com/@brookelark?utm_source=27appstudio_showcase&utm_medium=referral), [Nattu Adnan](https://unsplash.com/@reallynattu?utm_source=27appstudio_showcase&utm_medium=referral), [Adam Vradenburg](https://unsplash.com/@vradenburg?utm_source=27appstudio_showcase&utm_medium=referral), [Jei Lee](https://unsplash.com/@babybluecat?utm_source=27appstudio_showcase&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=27appstudio_showcase&utm_medium=referral). Each screen has its own tint (indigo, amber) and the dialog takes it. The scenes are in [`example/src/Showcase.tsx`](example/src/Showcase.tsx), captured and framed by [`scripts/screenshots`](scripts/screenshots).

It's a TurboModule with no views of its own in JS, no Expo modules, and no config plugin.

Used in production in [Splitify](https://splitify.cc).

## Installation

```sh
npm install @27appstudio/react-native-alert
cd ios && pod install
```

Requirements:

- React Native 0.82+ with the New Architecture
- **Android**: nothing more. The library ships `com.google.android.material:material` 1.13. Your app theme can stay AppCompat: dialogs are built with their own Material 3 theme (see [Android theme](#android-theme)).
- **Expo**: works in development builds, not in Expo Go.

## Usage

```ts
import { alert, prompt } from '@27appstudio/react-native-alert';

const colors = { tintColor: '#0B6E4F' };

alert(
  'Delete this expense?',
  'This cannot be undone.',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: deleteExpense },
  ],
  colors
);

const name = await prompt({
  ...colors,
  title: 'Rename',
  defaultValue: group.name,
  label: 'Name',
  autoCapitalize: 'words',
  confirmText: 'Save',
});
if (name !== null) {
  rename(name);
}
```

`alert` takes the same arguments as React Native's `Alert.alert`, so you can swap it in without other changes.

Alerts are shown one at a time, in call order. An alert raised while another is on screen waits for it to close instead of replacing it.

## API

### `alert(title, message?, buttons?, options?)`

`buttons` defaults to a single **OK**. Each button has:

| Field         |                                                                   |
| ------------- | ----------------------------------------------------------------- |
| `text`        |                                                                   |
| `onPress`     | Called when the button closes the alert.                          |
| `style`       | `'default'`, `'cancel'` or `'destructive'`.                       |
| `isPreferred` | iOS: the emphasized button. On iOS 26, it's filled with the tint. |

On Android, like React Native, only the last three buttons show: the last one is positive, the one before it negative, and the one before that neutral.

`options`:

| Option               |                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `tintColor`          | `default` buttons. iOS: every button except destructive ones (iOS 26 draws cancel and other buttons in the label color). |
| `labelColor`         | Android: `cancel` buttons. Defaults to the theme's button color.                                                         |
| `destructiveColor`   | Android: `destructive` buttons. Defaults to the theme's `colorError`. iOS always uses its system red.                    |
| `cancelable`         | Android: whether back or a tap outside dismisses the alert. Defaults to `false`, like React Native.                      |
| `onDismiss`          | Android: called when the alert is dismissed without a button.                                                            |
| `userInterfaceStyle` | iOS: `'light'`, `'dark'` or `'unspecified'`.                                                                             |

### `prompt(options): Promise<string | null>`

A one-field text prompt with a cancel and a confirm button. It resolves with the text as typed, or `null` when cancelled. The field is prefilled with `defaultValue` and focused. The confirm button is disabled while the field is blank, and the keyboard's Done key presses it.

| Option                      |                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------- |
| `title`                     | Required.                                                                        |
| `message`                   |                                                                                  |
| `defaultValue`              | Defaults to `''`.                                                                |
| `label`                     | Android: the field's floating label.                                             |
| `autoCapitalize`            | `'none'`, `'sentences'` (default), `'words'` or `'characters'`.                  |
| `cancelText`, `confirmText` | Default to `'Cancel'` and `'OK'`.                                                |
| `tintColor`                 | The confirm button and the field (cursor; on Android the outline and label too). |
| `labelColor`                | Android: the cancel button.                                                      |
| `cancelable`                | Android: whether back or a tap outside cancels. Defaults to `true`.              |
| `userInterfaceStyle`        | iOS, as for `alert`.                                                             |

On Android, the field has `rn-alert-prompt-input` as its tag, so Detox's `by.id('rn-alert-prompt-input')` finds it.

### `isAvailable: boolean`

`false` where the native module is missing (web, Expo Go). There, `alert` falls back to React Native's `Alert` and `prompt` rejects.

## Android theme

Dialogs are built with the `Theme.RNAlert` style, a plain `Theme.Material3.DayNight.NoActionBar`. To change the surface and text colors, redefine it in your app's `android/app/src/main/res/values/styles.xml`; your app's resources win over the library's:

```xml
<style name="Theme.RNAlert" parent="Theme.Material3.DayNight.NoActionBar">
    <item name="colorSurfaceContainerHigh">@color/dialog_background</item>
    <item name="colorOnSurface">@color/label</item>
    <item name="colorOnSurfaceVariant">@color/secondary_label</item>
</style>
```

Button colors still come from JS when you pass them.

## Platform notes

- **iOS 26 preferred button**: the filled button's black label on a light tint is set through `UIAlertAction`'s private `titleTextColor` key, since there's no public API for it. If a future iOS drops the key, the label falls back to white and a warning is logged.
- **Several cancel buttons**: `UIAlertController` allows one. On iOS, like React Native, later `cancel` buttons are shown as `default` ones.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

## react-native-alert is made by 27AppStudio

[27AppStudio](https://27appstudio.com) is an independent French mobile app studio. We build iPhone and Android apps, and open-source the native UI components and release tooling we make along the way. Need a hand with a React Native app? [Get in touch](https://27appstudio.com).
