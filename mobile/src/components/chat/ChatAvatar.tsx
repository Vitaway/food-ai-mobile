import { Image, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { chatTheme } from '@/components/chat/chatTheme';
import { resolveMediaUrl } from '@/utils/mediaUrls';
import { cn } from '@/utils/cn';

type ChatAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZES = {
  sm: { box: 'h-10 w-10', text: 'text-sm' },
  md: { box: 'h-11 w-11', text: 'text-base' },
  lg: { box: 'h-12 w-12', text: 'text-lg' },
} as const;

export function ChatAvatar({ name, imageUrl, size = 'md', className }: ChatAvatarProps) {
  const dims = SIZES[size];
  const initial = name.trim().slice(0, 1).toUpperCase() || '?';
  const src = resolveMediaUrl(imageUrl);

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        className={cn('rounded-full bg-white/20', dims.box, className)}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      className={cn('items-center justify-center rounded-full bg-white/20', dims.box, className)}
      style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
      <Text className={cn('font-sans-bold text-white', dims.text)}>{initial}</Text>
    </View>
  );
}

export function ChatListAvatar({
  name,
  imageUrl,
  size = 'md',
}: {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md';
}) {
  const dims = size === 'sm' ? 'h-12 w-12' : 'h-14 w-14';
  const initial = name.trim().slice(0, 1).toUpperCase() || '?';
  const src = resolveMediaUrl(imageUrl);

  if (src) {
    return <Image source={{ uri: src }} className={cn('rounded-full', dims)} resizeMode="cover" />;
  }

  return (
    <View
      className={cn('items-center justify-center rounded-full', dims)}
      style={{ backgroundColor: chatTheme.header }}>
      <Text className="font-sans-bold text-lg text-white">{initial}</Text>
    </View>
  );
}
