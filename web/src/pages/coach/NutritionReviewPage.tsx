import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { NutritionFoodEditorModal } from '@/components/nutrition/NutritionFoodEditorModal';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import {
  approveNutritionFoodDb,
  fetchNutritionReviewQueue,
  returnNutritionFood,
  type NutritionFood,
} from '@/api/nutritionDbApi';
import {
  approveNutritionRecipe,
  returnNutritionRecipe,
  type NutritionRecipe,
} from '@/api/nutritionRecipeApi';
import { useAuth } from '@/features/auth';

type QueueItem =
  | { kind: 'food'; item: NutritionFood }
  | { kind: 'recipe'; item: NutritionRecipe };

function flagsForFood(food: NutritionFood): Array<{ tone: 'bad' | 'warn' | 'good'; text: string }> {
  const flags: Array<{ tone: 'bad' | 'warn' | 'good'; text: string }> = [];
  if (food.sodiumMissing) flags.push({ tone: 'bad', text: 'Sodium missing — blocks hypertension screening' });
  if (!food.source) flags.push({ tone: 'bad', text: 'No data source recorded — cannot be verified' });
  const filled = food.fieldCompleteness?.filled ?? 0;
  const total = food.fieldCompleteness?.total ?? 15;
  if (filled < total) {
    flags.push({
      tone: 'warn',
      text: `${total - filled} nutrients unknown — will be hidden, not zeroed`,
    });
  }
  if (food.allergens?.length) {
    flags.push({ tone: 'bad', text: `Allergen: ${food.allergens.join(', ')}` });
  }
  if (food.energyCheck && Math.abs(food.energyCheck.deltaPct) > 10) {
    flags.push({
      tone: 'warn',
      text: `Energy cross-check off by ${Math.round(food.energyCheck.deltaPct)}%`,
    });
  }
  if (!flags.length) flags.push({ tone: 'good', text: 'No automatic flags raised' });
  return flags;
}

function flagsForRecipe(recipe: NutritionRecipe): Array<{ tone: 'bad' | 'warn' | 'good'; text: string }> {
  const flags: Array<{ tone: 'bad' | 'warn' | 'good'; text: string }> = [];
  const hasSalt = recipe.ingredients?.some((i) => /salt/i.test(i.name));
  if (!hasSalt) flags.push({ tone: 'bad', text: 'No salt entered' });
  if (recipe.yieldFactor != null && (recipe.yieldFactor < 0.55 || recipe.yieldFactor > 3.2)) {
    flags.push({
      tone: 'bad',
      text: `Yield factor ${recipe.yieldFactor.toFixed(2)}× implausible`,
    });
  }
  if (recipe.cookingMethod) {
    flags.push({
      tone: 'good',
      text: `Retention applied for ${recipe.cookingMethod.toLowerCase()}`,
    });
  }
  if (recipe.inheritedAllergens?.length) {
    flags.push({
      tone: 'warn',
      text: `Inherited allergens: ${recipe.inheritedAllergens.join(', ')}`,
    });
  }
  return flags;
}

export function NutritionReviewPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const canApprove = Boolean(user?.role === 'coach' || user?.role === 'admin');
  const [editingFood, setEditingFood] = useState<NutritionFood | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['nutrition-review-queue'],
    queryFn: fetchNutritionReviewQueue,
    refetchInterval: 30_000,
  });

  const returnMutation = useMutation({
    mutationFn: async (row: QueueItem) => {
      if (row.kind === 'food') return returnNutritionFood(row.item.id);
      return returnNutritionRecipe(row.item.id);
    },
    onSuccess: () => {
      toast.success('Returned to coach as draft');
      void qc.invalidateQueries({ queryKey: ['nutrition-review-queue'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not return item')),
  });

  const approveMutation = useMutation({
    mutationFn: async (row: QueueItem) => {
      if (row.kind === 'food') return approveNutritionFoodDb(row.item.id);
      return approveNutritionRecipe(row.item.id);
    },
    onSuccess: () => {
      toast.success('Approved and published');
      void qc.invalidateQueries({ queryKey: ['nutrition-review-queue'] });
      void qc.invalidateQueries({ queryKey: ['nutrition-recipes'] });
      void qc.invalidateQueries({ queryKey: ['coach', 'nutrition-db'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'nutrition-db'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not approve')),
  });

  const items: QueueItem[] = [
    ...(data?.foods ?? []).map((item) => ({ kind: 'food' as const, item })),
    ...(data?.recipes ?? []).map((item) => ({ kind: 'recipe' as const, item: item as NutritionRecipe })),
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Nutrition review" />
      <p className="-mt-4 text-sm text-ash-grey-500">
        Coach food and recipe submissions awaiting clinical sign-off.
      </p>

      {isLoading ? (
        <p className="text-sm text-ash-grey-500">Loading queue…</p>
      ) : !items.length ? (
        <div className="rounded-2xl border border-ash-grey-100 bg-white px-6 py-16 text-center">
          <p className="font-semibold text-ash-grey-900">Nothing waiting</p>
          <p className="mt-1 text-sm text-ash-grey-500">
            Submissions from coaches appear here for sign-off.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((row) => {
            const name = row.item.name;
            const kin = row.item.nameRw;
            const flags =
              row.kind === 'food' ? flagsForFood(row.item) : flagsForRecipe(row.item);
            return (
              <article
                key={`${row.kind}-${row.item.id}`}
                className="rounded-2xl border border-ash-grey-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-ash-grey-900">{name}</h3>
                    <p className="text-xs text-ash-grey-500">
                      {row.kind === 'food' ? 'Single food' : `Recipe v${row.item.recipeVersion ?? 1}`}
                      {kin ? ` · ${kin}` : ''}
                    </p>
                  </div>
                  <StatusPill tone="warn">Awaiting review</StatusPill>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {row.kind === 'food' ? (
                    <>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-ash-grey-400">Source</p>
                        <p className="text-sm">{row.item.source || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-ash-grey-400">
                          Reference
                        </p>
                        <p className="text-sm">{row.item.sourceReference || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-ash-grey-400">Energy</p>
                        <p className="font-mono text-sm">
                          {row.item.nutritionPer100g?.caloriesKcal ?? '—'} kcal
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-ash-grey-400">Sodium</p>
                        <p className="font-mono text-sm">
                          {row.item.micronutrients?.sodiumMg ??
                            row.item.composition?.sodium_mg ??
                            '—'}{' '}
                          mg
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-ash-grey-400">Fields</p>
                        <p className="font-mono text-sm">
                          {row.item.fieldCompleteness?.filled ?? 0}/
                          {row.item.fieldCompleteness?.total ?? 15}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-ash-grey-400">Method</p>
                        <p className="text-sm">{row.item.cookingMethod || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-ash-grey-400">Yield</p>
                        <p className="font-mono text-sm">
                          {row.item.yieldFactor != null ? `${row.item.yieldFactor}×` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-ash-grey-400">
                          Serving
                        </p>
                        <p className="font-mono text-sm">
                          {row.item.defaultServing?.gramsEquivalent ?? '—'} g
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-ash-grey-400">Energy</p>
                        <p className="font-mono text-sm">
                          {row.item.kcalPerServing != null
                            ? `${Math.round(row.item.kcalPerServing)} kcal`
                            : '—'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <ul className="mt-4 space-y-1.5">
                  {flags.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm">
                      <span
                        className={
                          f.tone === 'bad'
                            ? 'mt-1.5 h-2 w-2 rounded-full bg-red-500'
                            : f.tone === 'warn'
                              ? 'mt-1.5 h-2 w-2 rounded-full bg-amber-500'
                              : 'mt-1.5 h-2 w-2 rounded-full bg-emerald-500'
                        }
                      />
                      <span
                        className={
                          f.tone === 'good' ? 'text-ash-grey-600' : f.tone === 'bad' ? 'text-red-800' : 'text-amber-900'
                        }>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-2">
                  {row.kind === 'food' ? (
                    <Button variant="outline" size="sm" onClick={() => setEditingFood(row.item)}>
                      Open and edit
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={returnMutation.isPending}
                    onClick={() => void returnMutation.mutateAsync(row)}>
                    Return to coach
                  </Button>
                  {canApprove ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={approveMutation.isPending}
                      onClick={() => void approveMutation.mutateAsync(row)}>
                      Approve and publish
                    </Button>
                  ) : (
                    <p className="self-center text-xs text-ash-grey-500">
                      Admin approval required to publish
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <NutritionFoodEditorModal
        open={Boolean(editingFood)}
        editing={editingFood}
        mode={canApprove ? 'admin' : 'coach'}
        onClose={() => setEditingFood(null)}
        onSaved={() => void qc.invalidateQueries({ queryKey: ['nutrition-review-queue'] })}
      />
    </div>
  );
}
