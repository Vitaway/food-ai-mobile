import { create } from 'zustand';
import type { DetectedFoodItem } from '@/types';
import { newIngredient, scaleItemNutrition, sumNutrition } from '@/lib/nutrition';

type ReviewDraft = {
  mealId: string;
  mealName: string;
  items: DetectedFoodItem[];
  note: string;
  trainingNote: string;
};

type CoachUiState = {
  coachName: string;
  selectedMealId: string | null;
  reviewDraft: ReviewDraft | null;
  filter: 'all' | 'flagged' | 'low_confidence';
  queueSearch: string;
  queueSort: 'oldest' | 'newest' | 'flagged' | 'low_confidence' | 'sla_urgency';
  cohortId: string | null;
  setSelectedMealId: (id: string | null) => void;
  setFilter: (filter: CoachUiState['filter']) => void;
  setQueueSearch: (search: string) => void;
  setQueueSort: (sort: CoachUiState['queueSort']) => void;
  setCohortId: (id: string | null) => void;
  startReviewDraft: (mealId: string, mealName: string, items: DetectedFoodItem[]) => void;
  updateDraftItem: (itemId: string, patch: Partial<DetectedFoodItem>) => void;
  updateDraftItemWeight: (itemId: string, weightG: number) => void;
  updateDraftItemNutrition: (
    itemId: string,
    field: keyof DetectedFoodItem['nutrition'],
    value: number,
  ) => void;
  addDraftItem: () => void;
  removeDraftItem: (itemId: string) => void;
  updateDraftNote: (note: string) => void;
  updateDraftTrainingNote: (trainingNote: string) => void;
  updateDraftMealName: (name: string) => void;
  hydrateReviewDraft: (draft: ReviewDraft) => void;
  clearReviewDraft: () => void;
  draftTotals: () => ReturnType<typeof sumNutrition> | null;
};

export const useCoachStore = create<CoachUiState>((set, get) => ({
  coachName: 'Coach Vitaway',
  selectedMealId: null,
  reviewDraft: null,
  filter: 'all',
  queueSearch: '',
  queueSort: 'sla_urgency',
  cohortId: null,

  setSelectedMealId: (id) => set({ selectedMealId: id }),
  setFilter: (filter) => set({ filter }),
  setQueueSearch: (search) => set({ queueSearch: search }),
  setQueueSort: (sort) => set({ queueSort: sort }),
  setCohortId: (id) => set({ cohortId: id }),

  startReviewDraft: (mealId, mealName, items) =>
    set({
      reviewDraft: {
        mealId,
        mealName,
        items: items.map((i) => ({ ...i, nutrition: { ...i.nutrition }, foodSource: i.foodSource ?? 'ai' })),
        note: '',
        trainingNote: '',
      },
    }),

  hydrateReviewDraft: (draft) => set({ reviewDraft: draft }),

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

  updateDraftItemWeight: (itemId, weightG) =>
    set((state) => {
      if (!state.reviewDraft) return state;
      return {
        reviewDraft: {
          ...state.reviewDraft,
          items: state.reviewDraft.items.map((item) =>
            item.id === itemId ? scaleItemNutrition(item, weightG) : item,
          ),
        },
      };
    }),

  updateDraftItemNutrition: (itemId, field, value) =>
    set((state) => {
      if (!state.reviewDraft) return state;
      return {
        reviewDraft: {
          ...state.reviewDraft,
          items: state.reviewDraft.items.map((item) =>
            item.id === itemId
              ? { ...item, nutrition: { ...item.nutrition, [field]: value } }
              : item,
          ),
        },
      };
    }),

  addDraftItem: () =>
    set((state) => {
      if (!state.reviewDraft) return state;
      return {
        reviewDraft: {
          ...state.reviewDraft,
          items: [...state.reviewDraft.items, newIngredient()],
        },
      };
    }),

  removeDraftItem: (itemId) =>
    set((state) => {
      if (!state.reviewDraft) return state;
      return {
        reviewDraft: {
          ...state.reviewDraft,
          items: state.reviewDraft.items.filter((item) => item.id !== itemId),
        },
      };
    }),

  updateDraftNote: (note) =>
    set((state) =>
      state.reviewDraft ? { reviewDraft: { ...state.reviewDraft, note } } : state,
    ),

  updateDraftTrainingNote: (trainingNote) =>
    set((state) =>
      state.reviewDraft ? { reviewDraft: { ...state.reviewDraft, trainingNote } } : state,
    ),

  updateDraftMealName: (name) =>
    set((state) =>
      state.reviewDraft ? { reviewDraft: { ...state.reviewDraft, mealName: name } } : state,
    ),

  clearReviewDraft: () => set({ reviewDraft: null }),

  draftTotals: () => {
    const draft = get().reviewDraft;
    if (!draft?.items.length) return null;
    return sumNutrition(draft.items);
  },
}));
