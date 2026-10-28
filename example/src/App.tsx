import { useState } from 'react';
import {
  Button,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { alert, prompt } from '@27appstudio/react-native-alert';

// A dark tint for light mode, a light one for dark mode (iOS 26 gives the filled
// preferred button a black label there).
const TINTS = { light: '#0B6E4F', dark: '#9BE7C4' };
const LABELS = { light: '#1C1B1F', dark: '#E6E1E5' };
const BACKGROUNDS = { light: '#FFFFFF', dark: '#000000' };

export default function App() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [tinted, setTinted] = useState(true);
  const [log, setLog] = useState('Open an alert');

  const colors = tinted
    ? { tintColor: TINTS[scheme], labelColor: LABELS[scheme] }
    : {};

  return (
    <ScrollView
      // Android draws edge to edge: start below the status bar (iOS insets itself).
      contentContainerStyle={[
        styles.container,
        { paddingTop: 24 + (StatusBar.currentHeight ?? 0) },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: BACKGROUNDS[scheme] }}
    >
      <Text style={[styles.log, { color: LABELS[scheme] }]} testID="log">
        {log}
      </Text>
      <View style={styles.row}>
        <Text style={{ color: LABELS[scheme] }}>Tinted</Text>
        <Switch value={tinted} onValueChange={setTinted} testID="tinted" />
      </View>
      <Button
        title="One button"
        testID="one-button"
        onPress={() =>
          alert('Saved', 'Your changes are saved.', undefined, colors)
        }
      />
      <Button
        title="Cancel / Confirm"
        testID="two-buttons"
        onPress={() =>
          alert(
            'Leave the group?',
            'You can join it again with its link.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => setLog('Cancel'),
              },
              {
                text: 'Leave',
                isPreferred: true,
                onPress: () => setLog('Leave'),
              },
            ],
            colors
          )
        }
      />
      <Button
        title="Destructive"
        testID="destructive"
        onPress={() =>
          alert(
            'Delete this expense?',
            'This cannot be undone.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => setLog('Cancel'),
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => setLog('Delete'),
              },
            ],
            {
              ...colors,
              cancelable: true,
              onDismiss: () => setLog('Dismissed'),
            }
          )
        }
      />
      <Button
        title="Three buttons"
        testID="three-buttons"
        onPress={() =>
          alert(
            'Save the draft?',
            undefined,
            [
              { text: 'Later', onPress: () => setLog('Later') },
              {
                text: 'Discard',
                style: 'destructive',
                onPress: () => setLog('Discard'),
              },
              {
                text: 'Save',
                isPreferred: true,
                onPress: () => setLog('Save'),
              },
            ],
            colors
          )
        }
      />
      <Button
        title="Prompt"
        testID="prompt"
        onPress={async () => {
          const name = await prompt({
            ...colors,
            title: 'Rename',
            message: 'Choose a new name for this group.',
            defaultValue: 'Weekend trip',
            label: 'Name',
            autoCapitalize: 'words',
            confirmText: 'Save',
          });
          setLog(name === null ? 'Prompt cancelled' : `Name: ${name}`);
        }}
      />
      <Button
        title="Two alerts in a row"
        testID="queued"
        onPress={() => {
          alert(
            'First',
            'The second one waits for this one.',
            undefined,
            colors
          );
          alert('Second', undefined, undefined, colors);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    padding: 24,
  },
  log: {
    fontSize: 17,
    marginBottom: 8,
    textAlign: 'center',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
