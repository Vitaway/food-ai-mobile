import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, View } from 'react-native';

import { PhotoSourceMenu } from '@/components/ui/PhotoSourceMenu';
import { Text } from '@/components/ui/Text';

type ProfileAvatarPickerProps = {
  displayName: string;
  avatarUrl?: string;
  uploading?: boolean;
  onPick: (localUri: string) => void;
};

export function ProfileAvatarPicker({
  displayName,
  avatarUrl,
  uploading = false,
  onPick,
}: ProfileAvatarPickerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = displayName.trim().slice(0, 1).toUpperCase() || '?';

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      const label = source === 'camera' ? 'camera' : 'photos';
      Alert.alert(
        'Permission needed',
        permission.canAskAgain ? `Allow ${label} access to add a profile picture.` : `Enable ${label} in Settings.`,
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });

    if (!result.canceled && result.assets[0]?.uri) {
      onPick(result.assets[0].uri);
    }
  };

  return (
    <View className="items-center gap-3">
      <View className="relative h-[120px] w-[120px] items-center justify-center">
        <Pressable
          onPress={() => !uploading && setMenuOpen(true)}
          disabled={uploading}
          className="h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full border-2 border-ash-grey-200 bg-ash-grey-50">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Text className="font-sans-bold text-4xl text-blue-spruce-700">{initial}</Text>
          )}
          {uploading ? (
            <View className="absolute inset-0 items-center justify-center bg-black/40">
              <ActivityIndicator color="#ffffff" />
            </View>
          ) : null}
        </Pressable>

        {!uploading ? (
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            className="absolute bottom-1 right-1 h-9 w-9 items-center justify-center rounded-full border-[2.5px] border-white bg-shamrock-500 shadow-sm">
            <Ionicons name="camera" size={17} color="#ffffff" />
          </Pressable>
        ) : null}
      </View>

      <Text className="text-sm text-neutral-500">Tap photo or camera to update</Text>
      <PhotoSourceMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelectCamera={() => pickPhoto('camera')}
        onSelectGallery={() => pickPhoto('gallery')}
      />
    </View>
  );
}
