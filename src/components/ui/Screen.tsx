import { cn } from '@/utils/cn';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = ViewProps & {
  edges?: ('top' | 'bottom')[];
  className?: string;
};

export function Screen({ edges = ['top', 'bottom'], className, style, children, ...props }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn('flex-1 bg-ash-grey-50', className)}
      style={[
        {
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
        },
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
}
