import { Camera, MediaImage } from 'iconoir-react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { BRUTAL_BUTTON } from '@/design-system/brutalButton';
import { palette } from '@/design-system/colors';

type PhotoSourceMenuProps = {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
};

const MENU_BORDER = BRUTAL_BUTTON.borderWidth;
const MENU_RADIUS = BRUTAL_BUTTON.borderRadius;
const MENU_SHADOW = BRUTAL_BUTTON.shadowOffset;

export function PhotoSourceMenu({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
}: PhotoSourceMenuProps) {
  const handleCamera = () => {
    onClose();
    onSelectCamera();
  };

  const handleGallery = () => {
    onClose();
    onSelectGallery();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close photo options" />
        <View style={styles.menuHost}>
          <View style={styles.menuShadow} />
          <View style={styles.menu}>
            <Pressable
              accessibilityRole="button"
              onPress={handleCamera}
              className="flex-row items-center gap-3 border-b border-ash-grey-100 px-4 py-3.5 active:bg-ash-grey-50">
              <Camera width={20} height={20} color={palette['blue-spruce'][700]} strokeWidth={1.75} />
              <Text className="text-base text-neutral-900">Take photo</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleGallery}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-ash-grey-50">
              <MediaImage width={20} height={20} color={palette['blue-spruce'][700]} strokeWidth={1.75} />
              <Text className="text-base text-neutral-900">Choose from gallery</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 31, 28, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  menuHost: {
    width: '100%',
    maxWidth: 280,
    paddingRight: MENU_SHADOW,
    paddingBottom: MENU_SHADOW,
    zIndex: 1,
  },
  menuShadow: {
    position: 'absolute',
    top: MENU_SHADOW,
    left: MENU_SHADOW,
    right: 0,
    bottom: 0,
    backgroundColor: palette['blue-spruce'][900],
    borderRadius: MENU_RADIUS,
  },
  menu: {
    overflow: 'hidden',
    borderWidth: MENU_BORDER,
    borderColor: palette['blue-spruce'][900],
    borderRadius: MENU_RADIUS,
    backgroundColor: '#ffffff',
  },
});
