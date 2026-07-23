import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import {
  COUNTRY_DIAL_CODES,
  countryFlagEmoji,
  formatPhoneValue,
  getCountryByIso,
  parsePhoneValue,
} from '@/lib/countryDialCodes';

type PhoneFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
};

export function PhoneField({ label, value, onChange, hint }: PhoneFieldProps) {
  const parsed = useMemo(() => parsePhoneValue(value), [value]);
  const [iso, setIso] = useState(parsed.iso);
  const [national, setNational] = useState(parsed.national);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const next = parsePhoneValue(value);
    setIso(next.iso);
    setNational(next.national);
  }, [value]);

  const country = getCountryByIso(iso) ?? COUNTRY_DIAL_CODES[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_DIAL_CODES;
    return COUNTRY_DIAL_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.iso.toLowerCase().includes(q),
    );
  }, [query]);

  function emit(nextIso: string, nextNational: string) {
    onChange(formatPhoneValue(nextIso, nextNational));
  }

  return (
    <View>
      <Text className="mb-2 text-sm font-sans-medium text-neutral-700">{label}</Text>
      <View className="flex-row overflow-hidden rounded-2xl border border-ash-grey-100 bg-white">
        <Pressable
          onPress={() => setOpen(true)}
          className="flex-row items-center gap-1.5 border-r border-ash-grey-100 bg-ash-grey-50 px-3 py-3">
          <Text className="text-base">{countryFlagEmoji(country.iso)}</Text>
          <Text className="font-sans-medium text-neutral-900">+{country.dial}</Text>
          <Ionicons name="chevron-down" size={16} color="#848a75" />
        </Pressable>
        <TextInput
          value={national}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, '');
            setNational(digits);
            emit(iso, digits);
          }}
          keyboardType="phone-pad"
          placeholder="Phone number"
          placeholderTextColor="#9ca3af"
          className="min-w-0 flex-1 px-4 py-3 text-base text-neutral-900"
        />
      </View>
      {hint ? <Text className="mt-1.5 text-xs text-neutral-500">{hint}</Text> : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
        <View className="max-h-[70%] rounded-t-3xl bg-white px-4 pb-8 pt-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-sans-semibold text-lg text-neutral-900">Country code</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={22} color="#848a75" />
            </Pressable>
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search country…"
            placeholderTextColor="#9ca3af"
            className="mb-3 rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3 text-base"
          />
          <ScrollView>
            {filtered.map((c) => (
              <Pressable
                key={c.iso}
                onPress={() => {
                  setIso(c.iso);
                  setOpen(false);
                  setQuery('');
                  emit(c.iso, national);
                }}
                className="flex-row items-center gap-3 border-b border-ash-grey-50 py-3">
                <Text className="text-lg">{countryFlagEmoji(c.iso)}</Text>
                <Text className="flex-1 text-base text-neutral-900">{c.name}</Text>
                <Text className="text-sm text-neutral-500">+{c.dial}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
