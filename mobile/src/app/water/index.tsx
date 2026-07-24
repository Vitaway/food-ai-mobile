import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { WaterCustomStepper } from '@/components/water/WaterCustomStepper';
import { WaterHeroPanel } from '@/components/water/WaterHeroPanel';
import { WaterLogList } from '@/components/water/WaterLogList';
import { WaterQuickLog } from '@/components/water/WaterQuickLog';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useToast } from '@/context/ToastContext';
import { todayKey } from '@/utils/dates';
import { formatCupsLabel, mlToCups, toWholeGlasses } from '@/utils/waterUnits';

export default function WaterScreen() {
  const { back } = useNavigateOnce();
  const toast = useToast();
  const { dailyLog, logWaterCups, removeWaterEntry } = useMeals();
  const { profile } = useProfile();
  const [selectedDate] = useState(todayKey());
  const { dashboard } = useDashboard(selectedDate);
  const [customCups, setCustomCups] = useState(1);
  const [logging, setLogging] = useState(false);

  const waterMl = selectedDate === dailyLog.date ? dailyLog.waterMl : dashboard.waterMl;
  const waterTargetMl = profile?.waterTargetMl ?? dashboard.waterTargetMl;
  const cupsLogged = mlToCups(waterMl);
  const cupsTarget = mlToCups(waterTargetMl);
  const entries = selectedDate === dailyLog.date ? (dailyLog.waterEntries ?? []) : [];

  const progress = useMemo(() => {
    if (!waterTargetMl) return 0;
    return Math.min(1, waterMl / waterTargetMl);
  }, [waterMl, waterTargetMl]);

  const remainingCups = Math.max(0, cupsTarget - cupsLogged);

  const applyCups = useCallback(
    async (cups: number, message: string) => {
      const whole = cups < 0 ? -toWholeGlasses(Math.abs(cups)) : toWholeGlasses(cups);
      if (whole === 0) return;
      setLogging(true);
      try {
        await logWaterCups(whole, selectedDate);
        toast.success(message, 'Hydration');
      } catch {
        toast.error('Could not update water right now.');
      } finally {
        setLogging(false);
      }
    },
    [logWaterCups, selectedDate, toast],
  );

  const handleAddCups = useCallback(
    (cups: number) => {
      const whole = toWholeGlasses(Math.abs(cups));
      const label = cups > 0 ? `+${formatCupsLabel(whole)}` : `Removed ${formatCupsLabel(whole)}`;
      void applyCups(cups > 0 ? whole : -whole, label);
    },
    [applyCups],
  );

  const handleCustomAdd = useCallback(() => {
    const whole = Math.max(1, toWholeGlasses(customCups));
    void applyCups(whole, `+${formatCupsLabel(whole)}`);
  }, [applyCups, customCups]);

  const handleRemoveEntry = useCallback(
    async (entryId: string, cups: number) => {
      setLogging(true);
      try {
        await removeWaterEntry(entryId, selectedDate);
        toast.success(`Removed ${formatCupsLabel(cups)}`, 'Hydration');
      } catch {
        toast.error('Could not remove that entry.');
      } finally {
        setLogging(false);
      }
    },
    [removeWaterEntry, selectedDate, toast],
  );

  return (
    <View className="flex-1 bg-ash-grey-50">
      <ScreenTopBar title="Water" onBack={back} />

      <StackScreenBody className="bg-ash-grey-50">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 px-5 pb-10 pt-4">
          <WaterHeroPanel
            cupsLogged={cupsLogged}
            cupsTarget={cupsTarget}
            waterMl={waterMl}
            progress={progress}
            remainingCups={remainingCups}
          />

          <WaterQuickLog
            logging={logging}
            cupsLogged={cupsLogged}
            onAdd={handleAddCups}
            onRemove={(cups) => handleAddCups(-cups)}
          />

          <WaterCustomStepper
            cups={customCups}
            logging={logging}
            onChange={setCustomCups}
            onSubmit={handleCustomAdd}
          />

          <WaterLogList entries={entries} logging={logging} onRemove={(id, cups) => void handleRemoveEntry(id, cups)} />
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
