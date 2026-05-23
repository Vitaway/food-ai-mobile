export type LogStep = 'method' | 'scan' | 'analyzing' | 'results';

export const MOCK_MEAL_IMAGE =
  'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80';

export const MOCK_SCAN_RESULT = {
  name: 'Tomato Basil Pasta',
  weightG: 320,
  macros: [
    { label: 'Carbs', value: '18.2%', icon: 'nutrition-outline' as const, color: '#50af73', bg: '#eef7f1' },
    { label: 'Fats', value: '12.4%', icon: 'water-outline' as const, color: '#c4846e', bg: '#f8f0ed' },
    { label: 'Sugar', value: '6.8%', icon: 'cube-outline' as const, color: '#b5654a', bg: '#f8f0ed' },
  ],
};

export const MOCK_ANALYSIS = {
  name: 'Vegetable Salad Bowl',
  weightG: 250,
  petals: [
    { label: 'Tomatoes', percent: 34, color: '#50af73' },
    { label: 'Avocados', percent: 25, color: '#73bf8f' },
    { label: 'Spinach', percent: 15, color: '#5ca375' },
    { label: 'Nuts', percent: 12, color: '#c4846e' },
    { label: 'Olive oil', percent: 8, color: '#d3a292' },
    { label: 'Herbs', percent: 6, color: '#96cfab' },
  ],
  ingredients: [
    {
      id: '1',
      name: 'Tomatoes',
      weightG: 80,
      emoji: '🍅',
      macros: { carbs: '12g', fats: '0.2g', sugar: '3g' },
    },
    {
      id: '2',
      name: 'Avocados',
      weightG: 60,
      emoji: '🥑',
      macros: { carbs: '4g', fats: '9g', sugar: '0.5g' },
    },
    {
      id: '3',
      name: 'Spinach',
      weightG: 45,
      emoji: '🥬',
      macros: { carbs: '2g', fats: '0.3g', sugar: '0.2g' },
    },
    {
      id: '4',
      name: 'Mixed nuts',
      weightG: 35,
      emoji: '🥜',
      macros: { carbs: '5g', fats: '11g', sugar: '1g' },
    },
  ],
};
