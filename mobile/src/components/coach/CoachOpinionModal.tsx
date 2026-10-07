import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/ui/AppTextInput';
import { Text } from '@/components/ui/Text';
import { fetchCoachTeam } from '@/services/remote/coachApi';
import type { CoachTeamMember } from '@/types/coach';

export type OpinionDestination = 'coach' | 'admin' | 'team';

type CoachOpinionModalProps = {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    destination: OpinionDestination;
    assigneeUserId?: string;
    note: string;
  }) => void;
};

const DESTINATIONS: { id: OpinionDestination; label: string }[] = [
  { id: 'coach', label: 'Ask coach' },
  { id: 'admin', label: 'Ask admin' },
  { id: 'team', label: 'Team chat' },
];

function isCoachRole(role?: string | null) {
  return role === 'coach' || role === 'nutrition_coach' || !role;
}

export function CoachOpinionModal({
  visible,
  loading = false,
  onClose,
  onSubmit,
}: CoachOpinionModalProps) {
  const insets = useSafeAreaInsets();
  const [destination, setDestination] = useState<OpinionDestination>('coach');
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [note, setNote] = useState('');
  const [members, setMembers] = useState<CoachTeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDestination('coach');
    setAssigneeUserId('');
    setNote('');
    setPickerOpen(false);
    setTeamLoading(true);
    void fetchCoachTeam()
      .then((res) => setMembers(res.coaches ?? []))
      .catch(() => setMembers([]))
      .finally(() => setTeamLoading(false));
  }, [visible]);

  const people = useMemo(() => {
    const list = members.filter((m) => !m.isSelf);
    if (destination === 'admin') return list.filter((m) => m.role === 'admin');
    if (destination === 'coach') return list.filter((m) => isCoachRole(m.role));
    return [];
  }, [members, destination]);

  const selectedPerson = useMemo(
    () => people.find((p) => p.coachUserId === assigneeUserId) ?? null,
    [people, assigneeUserId],
  );

  const needsPerson = destination === 'coach' || destination === 'admin';
  const canSubmit =
    !loading &&
    (!needsPerson || Boolean(assigneeUserId)) &&
    !(needsPerson && people.length === 0 && !teamLoading);

  const pickerLabel =
    destination === 'admin' ? 'Which admin?' : 'Which coach?';
  const pickerPlaceholder =
    destination === 'admin' ? 'Select an admin' : 'Select a coach';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={loading ? undefined : onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/45">
        <Pressable className="flex-1" onPress={loading ? undefined : onClose} />
        <View
          className="max-h-[88%] rounded-t-[28px] bg-white px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
          <View className="mb-4 items-center">
            <View className="h-1.5 w-10 rounded-full bg-ash-grey-200" />
          </View>

          <Text className="font-sans-bold text-xl text-blue-spruce-900">Second opinion</Text>

          <View className="mt-4 flex-row gap-2">
            {DESTINATIONS.map((option) => {
              const selected = destination === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    setDestination(option.id);
                    setAssigneeUserId('');
                    setPickerOpen(false);
                  }}
                  className={`h-10 flex-1 items-center justify-center rounded-full border ${
                    selected
                      ? 'border-neutral-950 bg-neutral-950'
                      : 'border-ash-grey-200 bg-white'
                  }`}>
                  <Text
                    className={`text-[13px] font-sans-semibold ${
                      selected ? 'text-white' : 'text-blue-spruce-800'
                    }`}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            className="mt-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {needsPerson ? (
              <View>
                <Text className="mb-2 text-sm font-sans-semibold text-blue-spruce-900">
                  {pickerLabel}
                </Text>
                {teamLoading ? (
                  <View className="items-center py-4">
                    <ActivityIndicator color="#1a3a2a" />
                  </View>
                ) : people.length === 0 ? (
                  <View className="rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-3">
                    <Text className="text-sm text-amber-900">
                      {destination === 'admin'
                        ? 'No admins on your team yet.'
                        : 'No other coaches on your team. Try team chat.'}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Pressable
                      onPress={() => setPickerOpen((v) => !v)}
                      className="flex-row items-center rounded-[18px] border border-ash-grey-200 bg-ash-grey-50 px-4 py-3.5">
                      <View className="min-w-0 flex-1">
                        {selectedPerson ? (
                          <>
                            <Text className="font-sans-semibold text-[15px] text-blue-spruce-900">
                              {selectedPerson.displayName}
                            </Text>
                            {selectedPerson.title ? (
                              <Text className="mt-0.5 text-xs text-ash-grey-500">
                                {selectedPerson.title}
                              </Text>
                            ) : null}
                          </>
                        ) : (
                          <Text className="text-[15px] text-ash-grey-400">{pickerPlaceholder}</Text>
                        )}
                      </View>
                      <Ionicons
                        name={pickerOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#848a75"
                      />
                    </Pressable>

                    {pickerOpen ? (
                      <View className="mt-2 overflow-hidden rounded-[18px] border border-ash-grey-200 bg-white">
                        {people.map((person, index) => {
                          const selected = assigneeUserId === person.coachUserId;
                          return (
                            <Pressable
                              key={person.coachUserId}
                              onPress={() => {
                                setAssigneeUserId(person.coachUserId);
                                setPickerOpen(false);
                              }}
                              className={`px-4 py-3 ${
                                index > 0 ? 'border-t border-ash-grey-100' : ''
                              } ${selected ? 'bg-ash-grey-50' : 'bg-white'}`}>
                              <Text className="font-sans-semibold text-[15px] text-blue-spruce-900">
                                {person.displayName}
                              </Text>
                              {person.title ? (
                                <Text className="mt-0.5 text-xs text-ash-grey-500">
                                  {person.title}
                                </Text>
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            ) : (
              <View className="rounded-[18px] border border-ash-grey-200 bg-ash-grey-50 px-3 py-3">
                <Text className="text-sm leading-5 text-ash-grey-600">
                  Posts to team chat with a link to this meal.
                </Text>
              </View>
            )}

            <View className="mt-4 mb-2">
              <Text className="mb-2 text-sm font-sans-semibold text-blue-spruce-900">
                Note <Text className="font-sans-regular text-ash-grey-400">(optional)</Text>
              </Text>
              <AppTextInput
                value={note}
                onChangeText={setNote}
                placeholder="Anything to flag?"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                className="min-h-[88px] rounded-[20px] border border-ash-grey-200 bg-ash-grey-50 px-4 py-3 text-[15px] text-neutral-900"
                editable={!loading}
              />
            </View>
          </ScrollView>

          <View className="mt-3 flex-row gap-3">
            <Pressable
              disabled={loading}
              onPress={onClose}
              className="h-12 flex-1 items-center justify-center rounded-2xl border border-ash-grey-200 bg-white active:opacity-80">
              <Text className="font-sans-semibold text-[15px] text-blue-spruce-800">Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!canSubmit}
              onPress={() =>
                onSubmit({
                  destination,
                  assigneeUserId: destination === 'team' ? undefined : assigneeUserId,
                  note: note.trim(),
                })
              }
              className="h-12 flex-1 items-center justify-center rounded-2xl bg-neutral-950 active:opacity-90"
              style={{ opacity: canSubmit ? 1 : 0.45 }}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-sans-bold text-[15px] text-white">Send request</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
