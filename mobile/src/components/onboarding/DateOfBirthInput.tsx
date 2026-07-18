import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import {
  ageFromDateOfBirth,
  formatDateOfBirthInput,
  isValidDateOfBirth,
} from '@/utils/dateOfBirth';

export function DateOfBirthInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const complete = isValidDateOfBirth(draft);
  const invalidCompleteDate = draft.length === 10 && !complete;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <View className="rounded-3xl border border-blue-spruce-100 bg-blue-spruce-50/40 p-5">
      <Text className="text-sm font-sans-semibold text-neutral-900">Date of birth</Text>
      <Text className="mt-1 text-sm leading-5 text-neutral-600">
        Enter your birth date. Age is calculated automatically and stays accurate over time.
      </Text>
      <TextInput
        value={draft}
        onChangeText={(text) => {
          const formatted = formatDateOfBirthInput(text);
          setDraft(formatted);
          onChange(formatted);
        }}
        placeholder="YYYY-MM-DD"
        keyboardType="number-pad"
        maxLength={10}
        accessibilityLabel="Date of birth"
        className={`mt-4 rounded-2xl border bg-white px-4 py-4 text-center text-2xl font-sans-bold tracking-widest text-neutral-900 ${
          invalidCompleteDate ? 'border-red-400' : 'border-ash-grey-200'
        }`}
      />
      {complete ? (
        <Text className="mt-3 text-center text-sm font-sans-semibold text-shamrock-700">
          Age {ageFromDateOfBirth(draft)} · calculated automatically
        </Text>
      ) : (
        <Text className={`mt-3 text-center text-sm ${invalidCompleteDate ? 'text-red-600' : 'text-neutral-500'}`}>
          {invalidCompleteDate
            ? 'Enter a valid birth date for someone aged 13–120.'
            : 'Example: 1998-07-18'}
        </Text>
      )}
    </View>
  );
}
