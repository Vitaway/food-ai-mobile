import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { PillOption } from '@/components/ui/PillOption';
import { Text } from '@/components/ui/Text';
import { MEAL_TYPES, type MealTypeId } from '@/constants/mealTypes';
import { palette } from '@/design-system/colors';

const INPUT_METHODS = [
  { id: 'camera', label: 'Add food via photo', icon: 'camera-outline' as const },
  { id: 'gallery', label: 'Import from gallery', icon: 'images-outline' as const },
  { id: 'text', label: 'Text only', icon: 'text-outline' as const },
  { id: 'past', label: 'From past meals', icon: 'time-outline' as const },
];

export default function LogMealScreen() {
  const insets = useSafeAreaInsets();
  const [selectedMethod, setSelectedMethod] = useState('camera');
  const [selectedMealType, setSelectedMealType] = useState<MealTypeId>(MEAL_TYPES[2].id);

  return (
    <LinearGradient
      colors={[palette['blue-spruce'][700], palette['blue-spruce'][500], palette['muted-teal'][400]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="flex-1">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 24,
          paddingHorizontal: 24,
          flexGrow: 1,
        }}>
        <Text className="font-sans-bold text-3xl text-white">Log your meal</Text>
        <Text className="mt-2 text-base leading-6 text-white/85">
          Choose how you want to capture what you ate today.
        </Text>

        <View className="mt-10 gap-3">
          {INPUT_METHODS.map((method) => (
            <PillOption
              key={method.id}
              label={method.label}
              icon={method.icon}
              selected={selectedMethod === method.id}
              onPress={() => setSelectedMethod(method.id)}
            />
          ))}
        </View>

        <View className="mt-10">
          <Text className="mb-3 font-sans-semibold text-lg text-white">Meal type</Text>
          <View className="flex-row flex-wrap gap-2">
            {MEAL_TYPES.slice(0, 6).map((mealType) => {
              const isSelected = selectedMealType === mealType.id;

              return (
                <Pressable
                  key={mealType.id}
                  onPress={() => setSelectedMealType(mealType.id)}
                  className={`rounded-full border px-4 py-2 ${
                    isSelected ? 'border-white bg-white' : 'border-white/40 bg-white/10'
                  }`}>
                  <Text className={`text-sm font-sans-medium ${isSelected ? 'text-blue-spruce-800' : 'text-white'}`}>
                    {mealType.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          className="mt-10 items-center rounded-full bg-blue-spruce-950 py-4"
          style={Platform.select({
            ios: {
              shadowColor: '#051f1c',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
            },
            android: { elevation: 8 },
          })}>
          <Text className="font-sans-semibold text-base text-white">Submit for analysis</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}
