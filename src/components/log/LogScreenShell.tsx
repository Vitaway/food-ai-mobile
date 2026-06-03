import type { PropsWithChildren } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';

import { LogFlowHeader } from '@/components/log/LogFlowHeader';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ContentSheet } from '@/components/ui/GradientHeader';
import { palette } from '@/design-system/colors';

const cardShadow: ViewStyle = {
  shadowColor: '#1a1c17',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 2,
};

export function logCardClassName(extra = '') {
  return `rounded-3xl bg-white p-5 ${extra}`.trim();
}

export function LogCard({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <View className={logCardClassName(className)} style={cardShadow}>
      {children}
    </View>
  );
}

type LogScreenShellProps = PropsWithChildren<{
  title: string;
  onBack?: () => void;
  scroll?: boolean;
  bottomPadding?: number;
}>;

export function LogScreenShell({
  title,
  onBack,
  scroll = true,
  bottomPadding = FLOATING_TAB_BAR_CLEARANCE,
  children,
}: LogScreenShellProps) {
  const body = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      contentContainerClassName="gap-4">
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1" style={{ paddingBottom: bottomPadding }}>
      {children}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <LogFlowHeader title={title} onBack={onBack} />
      <ContentSheet className="flex-1 pt-5" style={{ backgroundColor: palette['ash-grey'][50] }}>
        {body}
      </ContentSheet>
    </View>
  );
}
