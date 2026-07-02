import type { PropsWithChildren, ReactNode } from 'react';
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
  footer?: ReactNode;
}>;

export function LogScreenShell({
  title,
  onBack,
  scroll = true,
  bottomPadding = FLOATING_TAB_BAR_CLEARANCE,
  footer,
  children,
}: LogScreenShellProps) {
  const body = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: footer ? 16 : bottomPadding }}
      contentContainerClassName="gap-4">
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1" style={{ paddingBottom: footer ? 0 : bottomPadding }}>
      {children}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <LogFlowHeader title={title} onBack={onBack} />
      <ContentSheet className="flex-1 pt-5" style={{ backgroundColor: palette['ash-grey'][50] }}>
        <View className="flex-1">
          {body}
          {footer ? (
            <View
              className="border-t border-ash-grey-100 bg-white px-5 pt-3"
              style={{ paddingBottom: bottomPadding }}>
              {footer}
            </View>
          ) : null}
        </View>
      </ContentSheet>
    </View>
  );
}
