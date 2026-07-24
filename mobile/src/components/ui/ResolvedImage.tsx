import { useEffect, useState, type ReactNode } from 'react';
import { Image, type ImageProps, View, type StyleProp, type ImageStyle, type ViewStyle } from 'react-native';

import { resolveMediaUrl } from '@/utils/mediaUrls';
import { cn } from '@/utils/cn';

type ResolvedImageProps = Omit<ImageProps, 'source'> & {
  uri?: string | null;
  /** Shown when uri is missing or fails to load. */
  fallback?: ReactNode;
  containerClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

/** Loads meal/avatar/chat media with auth token + API origin rewrite. */
export function ResolvedImage({
  uri,
  fallback,
  className,
  containerClassName,
  containerStyle,
  imageStyle,
  style,
  onError,
  ...rest
}: ResolvedImageProps) {
  const src = resolveMediaUrl(uri);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <View className={cn(containerClassName, className)} style={containerStyle}>
        {fallback ?? null}
      </View>
    );
  }

  return (
    <Image
      {...rest}
      source={{ uri: src }}
      className={className}
      style={[imageStyle, style]}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
}
