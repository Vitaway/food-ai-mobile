import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import type { PlateGroup } from '@/types/balancedPlate';
import type { StoryPlateItem } from '@/utils/weeklyStory';

const GROUP_COLOR: Record<PlateGroup, string> = {
  vf: '#3F8F4A',
  pr: '#1D9E75',
  st: '#EFA436',
  other: '#8FA86A',
};

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, r: number, start: number, end: number) {
  const a = polar(cx, cy, r, start);
  const b = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

type StoryPlateArtProps = {
  items: StoryPlateItem[];
  size?: number;
  rim?: string;
  ink?: string;
};

/** Decorative composed plate for story slides — wedges by food weight + plate group. */
export function StoryPlateArt({
  items,
  size = 220,
  rim = 'rgba(255,255,255,0.35)',
  ink = '#ffffff',
}: StoryPlateArtProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.46;
  const total = items.reduce((sum, item) => sum + Math.max(item.weightG, 1), 0) || 1;

  let angle = 0;
  const wedges =
    items.length === 0
      ? [{ color: GROUP_COLOR.other, start: 0, end: 360, label: '' }]
      : items.map((item) => {
          const sweep = (Math.max(item.weightG, 1) / total) * 360;
          const start = angle;
          const end = angle + Math.max(sweep, 18);
          angle = end;
          return {
            color: GROUP_COLOR[item.plateGroup] ?? GROUP_COLOR.other,
            start,
            end: Math.min(end, 360),
            label: item.label,
          };
        });

  // Normalize if we overshot.
  if (wedges.length && wedges[wedges.length - 1].end < 360) {
    wedges[wedges.length - 1].end = 360;
  }

  const chips = items.slice(0, 4);

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.08)',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 8,
        }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={outer + 6} fill={rim} />
          <G>
            {wedges.map((w, i) =>
              w.end - w.start >= 359 ? (
                <Circle key={i} cx={cx} cy={cy} r={outer} fill={w.color} />
              ) : (
                <Path
                  key={i}
                  d={wedgePath(cx, cy, outer, w.start, w.end)}
                  fill={w.color}
                />
              ),
            )}
          </G>
          <Circle cx={cx} cy={cy} r={outer * 0.22} fill="rgba(255,255,255,0.92)" />
        </Svg>
      </View>

      {chips.length ? (
        <View className="mt-4 flex-row flex-wrap items-center justify-center gap-2 px-2">
          {chips.map((item) => (
            <View
              key={`${item.label}-${item.plateGroup}`}
              className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
              <View
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: GROUP_COLOR[item.plateGroup] }}
              />
              <Text style={{ color: ink, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
