import { useEffect } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { alert, prompt } from '@27appstudio/react-native-alert';
import { ALBUM, NOTES, sized } from './showcasePhotos';

// The README screenshots: everyday app screens with the alert or prompt on top.
// Each scene opens its dialog by itself once the screen is drawn.
//   album   an album page with its cover photo, "Share this album?" in the studio indigo
//   notes   a notes list with photo thumbnails, the "Rename note" prompt in amber
// Each scene has its own tint, used by the screen and passed to the dialog, so the
// dialog visibly takes the app's color.
export type Scene = 'album' | 'notes';

const TINTS = {
  album: { light: '#3340FF', dark: '#5C67FF' },
  notes: { light: '#C76A00', dark: '#FFC45C' },
};
const LABELS = { light: '#1C1B1F', dark: '#E6E1E5' };

const PALETTE = {
  light: {
    background: '#FFFFFF',
    grouped: Platform.OS === 'ios' ? '#F2F2F7' : '#F3F4F8',
    card: '#FFFFFF',
    label: '#111114',
    secondary: '#6E6E73',
    separator: '#E2E2E7',
    fill: '#ECECF0',
  },
  dark: {
    background: '#000000',
    grouped: '#000000',
    card: '#1C1C1E',
    label: '#F5F5F7',
    secondary: '#98989F',
    separator: '#2C2C2E',
    fill: '#2C2C2E',
  },
};

const NOTE_TEXT = [
  {
    title: 'Trip ideas',
    body: 'Lisbon in May, tram 28 at sunrise, the tile museum…',
    date: '9:12',
  },
  {
    title: 'Brunch recipes',
    body: 'Ricotta pancakes, shakshuka, a big fruit plate',
    date: 'Yesterday',
  },
  {
    title: 'Surf week packing',
    body: 'Wetsuit, wax, sunscreen, the good towel',
    date: 'Monday',
  },
  {
    title: 'Hiking routes',
    body: 'Lake loop 12 km, ridge trail if the weather holds',
    date: '14 Nov',
  },
  {
    title: 'Garden plan',
    body: 'Cherry blossom by the fence, tulips along the path',
    date: '2 Nov',
  },
];

export function Showcase({ scene }: { scene: Scene }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    const colors = {
      tintColor: TINTS[scene][scheme],
      labelColor: LABELS[scheme],
    };
    const timer = setTimeout(() => {
      if (scene === 'album') {
        alert(
          'Share this album?',
          'Maya, Theo and Inès will be able to add their photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Share', isPreferred: true },
          ],
          colors
        );
      } else {
        prompt({
          ...colors,
          title: 'Rename note',
          defaultValue: 'Trip ideas',
          label: 'Name',
          autoCapitalize: 'sentences',
          confirmText: 'Save',
        });
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [scene, scheme]);

  return (
    <>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      {scene === 'album' ? (
        <Album scheme={scheme} />
      ) : (
        <Notes scheme={scheme} />
      )}
    </>
  );
}

function Album({ scheme }: { scheme: 'light' | 'dark' }) {
  const c = PALETTE[scheme];
  const tint = TINTS.album[scheme];
  const { width } = useWindowDimensions();
  const thumb = (width - 32 - 3 * 8) / 4;
  const rows = [
    ['People', 'Maya, Theo, Inès'],
    ['Location', 'Lago di Braies'],
    ['Shared album', 'Off'],
  ];
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      style={{ backgroundColor: c.background }}
    >
      <StatusBar barStyle="light-content" />
      <Image
        source={{ uri: sized(ALBUM[0]!, 1200, 1100) }}
        style={{ height: width * 0.92, width }}
      />
      <View style={styles.album}>
        <Text style={[styles.albumTitle, { color: c.label }]}>
          Summer in the Dolomites
        </Text>
        <Text style={[styles.subtitle, { color: c.secondary }]}>
          12–15 August · 48 photos
        </Text>
        <View style={styles.actions}>
          <View style={[styles.button, { backgroundColor: tint }]}>
            <Text style={[styles.buttonText, styles.onTint]}>Share</Text>
          </View>
          <View style={[styles.button, { backgroundColor: c.fill }]}>
            <Text style={[styles.buttonText, { color: tint }]}>Play</Text>
          </View>
        </View>
        <View style={styles.strip}>
          {ALBUM.slice(1).map((p) => (
            <Image
              key={p.id}
              source={{ uri: sized(p, 300) }}
              style={[styles.stripThumb, { height: thumb, width: thumb }]}
            />
          ))}
        </View>
        {rows.map(([k, v], i) => (
          <View
            key={k}
            style={[
              styles.infoRow,
              i > 0 && {
                borderTopColor: c.separator,
                borderTopWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <Text style={[styles.infoKey, { color: c.label }]}>{k}</Text>
            <Text style={[styles.infoValue, { color: c.secondary }]}>{v}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Notes({ scheme }: { scheme: 'light' | 'dark' }) {
  const c = PALETTE[scheme];
  return (
    <ScrollView
      contentContainerStyle={[
        styles.notes,
        { paddingTop: 8 + (StatusBar.currentHeight ?? 0) },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: c.grouped }}
    >
      <View style={styles.notesHeader}>
        <Text style={[styles.largeTitle, { color: c.label }]}>Notes</Text>
        <Text style={[styles.action, { color: TINTS.notes[scheme] }]}>New</Text>
      </View>
      <View style={[styles.search, { backgroundColor: c.fill }]}>
        <Text style={[styles.searchText, { color: c.secondary }]}>Search</Text>
      </View>
      <View style={[styles.card, { backgroundColor: c.card }]}>
        {NOTES.map((p, i) => (
          <View
            key={p.id}
            style={[
              styles.note,
              i > 0 && {
                borderTopColor: c.separator,
                borderTopWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <View style={styles.flex}>
              <Text style={[styles.noteTitle, { color: c.label }]}>
                {NOTE_TEXT[i]!.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.noteBody, { color: c.secondary }]}
              >
                <Text style={{ color: TINTS.notes[scheme] }}>
                  {NOTE_TEXT[i]!.date}
                </Text>
                {'  '}
                {NOTE_TEXT[i]!.body}
              </Text>
            </View>
            <Image source={{ uri: sized(p, 180) }} style={styles.thumb} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  album: { paddingBottom: 40, paddingHorizontal: 16, paddingTop: 18 },
  albumTitle: {
    fontSize: 28,
    fontWeight: Platform.OS === 'ios' ? '700' : '500',
  },
  button: {
    alignItems: 'center',
    borderRadius: 22,
    flex: 1,
    paddingVertical: 12,
  },
  buttonText: { fontSize: 17, fontWeight: '600' },
  infoKey: { fontSize: 17 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  infoValue: { fontSize: 17 },
  onTint: { color: '#FFFFFF' },
  strip: { flexDirection: 'row', gap: 8, marginBottom: 10, marginTop: 22 },
  stripThumb: { borderRadius: 12 },
  action: { fontSize: 17, fontWeight: '600' },
  card: {
    borderRadius: Platform.OS === 'ios' ? 26 : 24,
    marginTop: 20,
    overflow: 'hidden',
  },
  flex: { flex: 1 },
  largeTitle: {
    fontSize: 34,
    fontWeight: Platform.OS === 'ios' ? '700' : '500',
    letterSpacing: Platform.OS === 'ios' ? 0.4 : 0,
  },
  note: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noteBody: { fontSize: 15, marginTop: 3 },
  noteTitle: { fontSize: 17, fontWeight: '600' },
  notes: { paddingBottom: 40, paddingHorizontal: 16 },
  notesHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 4,
  },
  search: {
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchText: { fontSize: 17 },
  subtitle: { fontSize: 15, marginTop: 2 },
  thumb: { borderRadius: 10, height: 56, width: 56 },
});
