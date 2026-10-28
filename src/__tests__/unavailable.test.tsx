import { Alert as RNAlert } from 'react-native';

import { alert, isAvailable, prompt } from '../index';

// Web and Expo Go: no native module.
jest.mock('../NativeRNAlert', () => ({ __esModule: true, default: null }));

describe('without the native module', () => {
  it('is not available', () => {
    expect(isAvailable).toBe(false);
  });

  it("alerts through RN's Alert", () => {
    const systemAlert = jest
      .spyOn(RNAlert, 'alert')
      .mockImplementation(() => {});
    const buttons = [{ text: 'Cancel', style: 'cancel' as const }];

    alert('Title', 'Message', buttons, { tintColor: 'red' });

    expect(systemAlert).toHaveBeenCalledWith('Title', 'Message', buttons, {
      tintColor: 'red',
    });
    systemAlert.mockRestore();
  });

  it('rejects prompts', async () => {
    await expect(prompt({ title: 'Rename' })).rejects.toThrow(
      'native module missing'
    );
  });
});
