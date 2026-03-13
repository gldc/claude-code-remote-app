import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export function useCopyText() {
  return async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
}
