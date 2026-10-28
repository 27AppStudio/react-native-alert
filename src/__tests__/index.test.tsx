import { Alert as RNAlert, processColor } from 'react-native';

import NativeRNAlert from '../NativeRNAlert';
import { alert, isAvailable, prompt } from '../index';

jest.mock('../NativeRNAlert', () => ({
  __esModule: true,
  default: { alert: jest.fn(), prompt: jest.fn() },
}));

const nativeAlert = NativeRNAlert!.alert as jest.Mock;
const nativePrompt = NativeRNAlert!.prompt as jest.Mock;

// Alerts chain on a promise queue: let it run.
const flush = async () => {
  for (let i = 0; i < 5; i += 1) {
    await new Promise<void>((resolve) => setImmediate(() => resolve()));
  }
};

describe('react-native-alert', () => {
  let systemAlert: jest.SpyInstance;

  beforeEach(() => {
    nativeAlert.mockReset();
    nativePrompt.mockReset();
    systemAlert = jest.spyOn(RNAlert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    systemAlert.mockRestore();
  });

  it('is available when the native module is', () => {
    expect(isAvailable).toBe(true);
  });

  describe('alert', () => {
    it('sends the buttons, colors and options to the native module', async () => {
      nativeAlert.mockResolvedValue(-1);
      alert(
        'Delete?',
        'This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', isPreferred: true },
        ],
        {
          cancelable: true,
          destructiveColor: '#FF3B30',
          labelColor: 'black',
          tintColor: '#0B6E4F',
          userInterfaceStyle: 'dark',
        }
      );
      await flush();

      expect(nativeAlert).toHaveBeenCalledWith({
        buttons: [
          { isPreferred: false, style: 'cancel', text: 'Cancel' },
          { isPreferred: true, style: 'destructive', text: 'Delete' },
        ],
        cancelable: true,
        destructiveColor: processColor('#FF3B30'),
        labelColor: processColor('black'),
        message: 'This cannot be undone.',
        tintColor: processColor('#0B6E4F'),
        title: 'Delete?',
        userInterfaceStyle: 'dark',
      });
    });

    it('defaults to one OK button, not cancelable, system colors', async () => {
      nativeAlert.mockResolvedValue(0);
      alert('Saved');
      await flush();

      expect(nativeAlert).toHaveBeenCalledWith({
        buttons: [{ isPreferred: false, style: 'default', text: 'OK' }],
        cancelable: false,
        destructiveColor: undefined,
        labelColor: undefined,
        message: undefined,
        tintColor: undefined,
        title: 'Saved',
        userInterfaceStyle: 'unspecified',
      });
    });

    it('calls the pressed button', async () => {
      const onCancel = jest.fn();
      const onConfirm = jest.fn();
      nativeAlert.mockResolvedValue(1);
      alert('Title', undefined, [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Confirm', onPress: onConfirm },
      ]);
      await flush();

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('calls onDismiss when dismissed without a button', async () => {
      const onPress = jest.fn();
      const onDismiss = jest.fn();
      nativeAlert.mockResolvedValue(-1);
      alert('Title', undefined, [{ text: 'OK', onPress }], {
        cancelable: true,
        onDismiss,
      });
      await flush();

      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onPress).not.toHaveBeenCalled();
    });

    it("falls back to RN's Alert when the native alert can't be shown", async () => {
      const buttons = [{ text: 'OK' }];
      const options = { cancelable: true };
      nativeAlert.mockRejectedValue(new Error('E_NO_ACTIVITY'));
      alert('Title', 'Message', buttons, options);
      await flush();

      expect(systemAlert).toHaveBeenCalledWith(
        'Title',
        'Message',
        buttons,
        options
      );
    });

    it('does not show the alert again when a button callback throws', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      nativeAlert.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      alert('Title', undefined, [
        {
          text: 'Delete',
          onPress: () => {
            throw new Error('boom');
          },
        },
      ]);
      alert('Next');
      await flush();

      expect(systemAlert).not.toHaveBeenCalled();
      expect(nativeAlert).toHaveBeenCalledTimes(2);
      expect(nativeAlert.mock.calls[1][0].title).toBe('Next');
      expect(consoleError).toHaveBeenCalledWith(
        '[react-native-alert]',
        expect.any(Error)
      );
      consoleError.mockRestore();
    });

    it('shows queued alerts one after the other', async () => {
      const first: { close?: (index: number) => void } = {};
      nativeAlert
        .mockImplementationOnce(
          () =>
            new Promise<number>((resolve) => {
              first.close = resolve;
            })
        )
        .mockResolvedValueOnce(0);

      alert('First');
      alert('Second');
      await flush();

      expect(nativeAlert).toHaveBeenCalledTimes(1);
      expect(nativeAlert.mock.calls[0][0].title).toBe('First');

      first.close?.(0);
      await flush();

      expect(nativeAlert).toHaveBeenCalledTimes(2);
      expect(nativeAlert.mock.calls[1][0].title).toBe('Second');
    });
  });

  describe('prompt', () => {
    it('sends the defaults and resolves with the text', async () => {
      nativePrompt.mockResolvedValue({ confirmed: true, text: 'Ski days' });

      await expect(prompt({ title: 'Rename' })).resolves.toBe('Ski days');
      expect(nativePrompt).toHaveBeenCalledWith({
        autoCapitalize: 'sentences',
        cancelable: true,
        cancelText: 'Cancel',
        confirmText: 'OK',
        defaultValue: '',
        label: undefined,
        labelColor: undefined,
        message: undefined,
        tintColor: undefined,
        title: 'Rename',
        userInterfaceStyle: 'unspecified',
      });
    });

    it('sends its options and colors', async () => {
      nativePrompt.mockResolvedValue({ confirmed: true, text: 'Lou' });

      await prompt({
        autoCapitalize: 'words',
        cancelable: false,
        cancelText: 'Annuler',
        confirmText: 'Enregistrer',
        defaultValue: 'Max',
        label: 'Nom',
        labelColor: '#000000',
        message: 'Partout',
        tintColor: '#0B6E4F',
        title: 'Votre nom',
        userInterfaceStyle: 'light',
      });

      expect(nativePrompt).toHaveBeenCalledWith({
        autoCapitalize: 'words',
        cancelable: false,
        cancelText: 'Annuler',
        confirmText: 'Enregistrer',
        defaultValue: 'Max',
        label: 'Nom',
        labelColor: processColor('#000000'),
        message: 'Partout',
        tintColor: processColor('#0B6E4F'),
        title: 'Votre nom',
        userInterfaceStyle: 'light',
      });
    });

    it('resolves with null when cancelled, whatever was typed', async () => {
      nativePrompt.mockResolvedValue({ confirmed: false, text: 'Sam' });

      await expect(prompt({ title: 'Rename' })).resolves.toBeNull();
    });

    it("rejects when the prompt can't be shown", async () => {
      nativePrompt.mockRejectedValue(new Error('E_NO_PRESENTER'));

      await expect(prompt({ title: 'Rename' })).rejects.toThrow(
        'E_NO_PRESENTER'
      );
    });

    it('waits for the alert on screen', async () => {
      const shown: { close?: (index: number) => void } = {};
      nativeAlert.mockImplementationOnce(
        () =>
          new Promise<number>((resolve) => {
            shown.close = resolve;
          })
      );
      nativePrompt.mockResolvedValue({ confirmed: true, text: 'Lou' });

      alert('First');
      const name = prompt({ title: 'Rename' });
      await flush();
      expect(nativePrompt).not.toHaveBeenCalled();

      shown.close?.(0);
      await expect(name).resolves.toBe('Lou');
    });
  });
});
