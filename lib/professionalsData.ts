export interface Professional {
  id: string;
  name: string;
  type: 'photographer' | 'editor' | 'makeup_artist';
  rate: number; // e.g., in local currency units
  description: string;
  availability: string; // Dummy availability for now
}

export const photographers: Professional[] = [
  {
    id: 'ph-1',
    name: 'Alice Johnson',
    type: 'photographer',
    rate: 1500,
    description: 'Specializes in portrait and fashion photography.',
    availability: 'Mon-Fri (9 AM - 5 PM)',
  },
  {
    id: 'ph-2',
    name: 'Bob Williams',
    type: 'photographer',
    rate: 1800,
    description: 'Expert in event and product photography.',
    availability: 'Weekends (10 AM - 6 PM)',
  },
  {
    id: 'ph-3',
    name: 'Charlie Brown',
    type: 'photographer',
    rate: 1200,
    description: 'Creative candid shots and lifestyle photography.',
    availability: 'Tue, Thu (1 PM - 8 PM)',
  },
];

export const editors: Professional[] = [
  {
    id: 'ed-1',
    name: 'Diana Miller',
    type: 'editor',
    rate: 1000,
    description: 'Advanced photo retouching and color grading.',
    availability: 'Mon-Wed (Flexible)',
  },
  {
    id: 'ed-2',
    name: 'Eve Davis',
    type: 'editor',
    rate: 900,
    description: 'Quick turnaround for bulk photo editing.',
    availability: 'Thu-Fri (10 AM - 4 PM)',
  },
];

export const makeupArtists: Professional[] = [
  {
    id: 'mua-1',
    name: 'Frank Green',
    type: 'makeup_artist',
    rate: 800,
    description: 'Natural and theatrical make-up artistry.',
    availability: 'Weekends (Early Morning)',
  },
  {
    id: 'mua-2',
    name: 'Grace Hall',
    type: 'makeup_artist',
    rate: 950,
    description: 'Bridal and special occasion make-up.',
    availability: 'By appointment',
  },
];
