// Photos from Unsplash (unsplash.com, Unsplash License), hotlinked as its API guidelines ask.
// Credited in the README under the screenshots. Picked with the Unsplash API search.
export type Photo = { id: string; url: string; by: string; page: string };

export const sized = (p: Photo, w: number, h = w) =>
  `${p.url}&w=${w}&h=${h}&fit=crop&q=80&auto=format`;

// The album's cover, then its four thumbnails.
export const ALBUM: Photo[] = [
  {
    id: 'T7K4aEPoGGk',
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixid=M3wxMTM4ODM5fDB8MXxzZWFyY2h8MXx8dHJhdmVsJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc5NTEwNzg3MXww&ixlib=rb-4.1.0',
    by: 'Pietro De Grandi',
    page: 'https://unsplash.com/photos/three-brown-wooden-boat-on-blue-lake-water-taken-at-daytime-T7K4aEPoGGk',
  },
  {
    id: 'O453M2Liufs',
    url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixid=M3wxMTM4ODM5fDB8MXxzZWFyY2h8NHx8dHJhdmVsJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc5NTEwNzg3MXww&ixlib=rb-4.1.0',
    by: 'Luca Bravo',
    page: 'https://unsplash.com/photos/wooden-boat-on-lago-di-braies-O453M2Liufs',
  },
  {
    id: 'oMneOBYhJxY',
    url: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?ixid=M3wxMTM4ODM5fDB8MXxzZWFyY2h8Mnx8bW91bnRhaW4lMjBsYWtlfGVufDF8fHx8MTc5NTEwNzg3MXww&ixlib=rb-4.1.0',
    by: 'John Lee',
    page: 'https://unsplash.com/photos/scenery-of-mountain-oMneOBYhJxY',
  },
  {
    id: 'UkOpMcslmX8',
    url: 'https://images.unsplash.com/photo-1505490096310-204ef067fe6b?ixid=M3wxMTM4ODM5fDB8MXxzZWFyY2h8MTF8fG1vdW50YWluJTIwbGFrZXxlbnwxfHx8fDE3OTUxMDc4NzF8MA&ixlib=rb-4.1.0',
    by: 'Giammarco Boscaro',
    page: 'https://unsplash.com/photos/green-pine-trees-near-teal-water-at-daytime-UkOpMcslmX8',
  },
  {
    id: '-SFhuMwFClk',
    url: 'https://images.unsplash.com/photo-1548217395-6c6095abb49c?ixid=M3wxMTM4ODM5fDB8MXxzZWFyY2h8MTJ8fHRyYXZlbCUyMGxhbmRzY2FwZXxlbnwxfHx8fDE3OTUxMDc4NzF8MA&ixlib=rb-4.1.0',
    by: 'Cosmic Timetraveler',
    page: 'https://unsplash.com/photos/roadway-beside-iced-capped-mountain-during-daytime--SFhuMwFClk',
  },
];

export const NOTES: Photo[] = [
  {
    id: 'GkZvxVsHYWw',
    url: 'https://images.unsplash.com/photo-1510265236892-329bfd7de7a1?ixid=M3wxMTM4ODM5fDB8MXxzZWFyY2h8N3x8Y2l0eSUyMHN0cmVldHxlbnwxfHx8fDE3OTUxMDc4NzJ8MA&ixlib=rb-4.1.0',
    by: 'Bruno Martins',
    page: 'https://unsplash.com/photos/cobblestone-street-in-kynance-mews-london-GkZvxVsHYWw',
  },
  {
    id: 'HlNcigvUi4Q',
    url: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?ixid=M3wxMTM4ODM5fDB8MXxzZWFyY2h8NHx8Zm9vZCUyMHRhYmxlfGVufDF8fHx8MTc5NTEwNzg3Mnww&ixlib=rb-4.1.0',
    by: 'Brooke Lark',
    page: 'https://unsplash.com/photos/fruit-salad-on-gray-bowls-HlNcigvUi4Q',
  },
  {
    id: 'atSUvc1hMwk',
    url: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?ixid=M3wxMTM4ODM5fDB8MXxzZWFyY2h8NHx8YmVhY2glMjBzdW1tZXJ8ZW58MXx8fHwxNzk1MTA3ODcyfDA&ixlib=rb-4.1.0',
    by: 'Nattu Adnan',
    page: 'https://unsplash.com/photos/aerial-nature-photography-of-green-palms-on-seashore-during-daytime-atSUvc1hMwk',
  },
  {
    id: 'GA09PKfRIQY',
    url: 'https://images.unsplash.com/photo-1559310589-2673bfe16970?ixid=M3wxMTM4ODM5fDB8MXxzZWFyY2h8M3x8bW91bnRhaW4lMjBsYWtlfGVufDF8fHx8MTc5NTEwNzg3MXww&ixlib=rb-4.1.0',
    by: 'Adam Vradenburg',
    page: 'https://unsplash.com/photos/turquoise-lake-reflecting-snow-capped-mountains-GA09PKfRIQY',
  },
  {
    id: 'yRXuXvy4sQ4',
    url: 'https://images.unsplash.com/photo-1615280825886-fa817c0a06cc?ixid=M3wxMTM4ODM5fDB8MXxzZWFyY2h8Mnx8Zmxvd2Vyc3xlbnwxfHx8fDE3OTUxMDc4NzN8MA&ixlib=rb-4.1.0',
    by: 'Jei Lee',
    page: 'https://unsplash.com/photos/white-cherry-blossom-in-close-up-photography-yRXuXvy4sQ4',
  },
];
