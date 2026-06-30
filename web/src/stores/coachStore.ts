import { create } from 'zustand';
import type { DetectedFoodItem } from '@/types';

type ReviewDraft = {
  mealId: string;
  mealName: string;
  items: DetectedFoodItem[];
  note: string;
};

type CoachUiState = {
  coachName: string;
  selectedMealId: string | null;
  reviewDraft: ReviewDraft | null;
  filter: 'all' | 'flagged' | 'low_confidence';
  setSelectedMealId: (id: string | null) => void;
  setFilter: (filter: CoachUiState['filter']) => void;
  startReviewDraft: (mealId: string, mealName: string, items: DetectedFoodItem[]) => void;
  updateDraftItem: (itemId: string, patch: Partial<DetectedFoodItem>) => void;
  updateDraftNote: (note: string) => void;
  updateDraftMealName: (name: string) => void;
  clearReviewDraft: () => void;
};

export const useCoachStore = create<CoachUiState>((set) => ({
  coachName: 'Coach Vitaway',
  selectedMealId: null,
  reviewDraft: null,
  filter: 'all',

  setSelectedMealId: (id) => set({ selectedMealId: id }),
  setFilter: (filter) => set({ filter }),

  startReviewDraft: (mealId, mealName, items) =>
    set({
      reviewDraft: {
        mealId,
        mealName,
        items: items.map((i) => ({ ...i })),
        note: '',
      },
    }),

  updateDraftItem: (itemId, patch) =>
    set((state) => {
      if (!state.reviewDraft) return state;
      return {
        reviewDraft: {
          ...state.reviewDraft,
          items: state.reviewDraft.items.map((item) =>
            item.id === itemId ? { ...item, ...patch } : item,
          ),
        },
      };
    }),

  updateDraftNote: (note) =>
    set((state) =>
      state.reviewDraft ? { reviewDraft: { ...state.reviewDraft, note } } : state,
    ),

  updateDraftMealName: (name) =>
    set((state) =>
      state.reviewDraft ? { reviewDraft: { ...state.reviewDraft, mealName: name } } : state,
    ),

  clearReviewDraft: () => set({ reviewDraft: null }),
}));
