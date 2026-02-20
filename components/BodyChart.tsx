import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import Svg, { Path, Circle, Line, Text as SvgText, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2;
const CHART_HEIGHT = 200;
const PADDING = { top: 20, right: 15, bottom: 30, left: 40 };

interface DataPoint {
  label: string;
  value: number;
}

interface ChartLineProps {
  data: DataPoint[];
  color: string;
  label: string;
  unit: string;
  icon: string;
}

function ChartLine({ data, color, label, unit, icon }: ChartLineProps) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values) * 0.95;
  const maxVal = Math.max(...values) * 1.05;
  const range = maxVal - minVal || 1;

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const points = data.map((d, i) => ({
    x: PADDING.left + (i / (data.length - 1)) * innerW,
    y: PADDING.top + innerH - ((d.value - minVal) / range) * innerH,
  }));

  // Smooth path
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (pt.x - prev.x) / 3;
    const cpx2 = pt.x - (pt.x - prev.x) / 3;
    return `${acc} C ${cpx1} ${prev.y} ${cpx2} ${pt.y} ${pt.x} ${pt.y}`;
  }, '');

  // Gradient fill area
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaD = `${pathD} L ${lastPt.x} ${PADDING.top + innerH} L ${firstPt.x} ${PADDING.top + innerH} Z`;

  // Y axis labels
  const yLabels = [minVal, (minVal + maxVal) / 2, maxVal].map((v) => ({
    value: Math.round(v * 10) / 10,
    y: PADDING.top + innerH - ((v - minVal) / range) * innerH,
  }));

  const gradientId = `grad_${label.replace(/\s/g, '')}`;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartIcon}>{icon}</Text>
        <Text style={[styles.chartLabel, { color }]}>{label}</Text>
        <Text style={styles.chartCurrent}>
          {data[0].value} → {data[data.length - 1].value} {unit}
        </Text>
      </View>

      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {yLabels.map((yl, i) => (
          <Line
            key={i}
            x1={PADDING.left}
            y1={yl.y}
            x2={CHART_WIDTH - PADDING.right}
            y2={yl.y}
            stroke={Colors.cardBorder}
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
        ))}

        {/* Y labels */}
        {yLabels.map((yl, i) => (
          <SvgText
            key={`y${i}`}
            x={PADDING.left - 5}
            y={yl.y + 4}
            fontSize={10}
            fill={Colors.textMuted}
            textAnchor="end"
          >
            {yl.value}
          </SvgText>
        ))}

        {/* X labels */}
        {data.map((d, i) => {
          if (i % Math.ceil(data.length / 5) !== 0 && i !== data.length - 1) return null;
          return (
            <SvgText
              key={`x${i}`}
              x={points[i].x}
              y={CHART_HEIGHT - 5}
              fontSize={10}
              fill={Colors.textMuted}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          );
        })}

        {/* Area fill */}
        <Path d={areaD} fill={`url(#${gradientId})`} />

        {/* Line */}
        <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} />

        {/* Current point (first) */}
        <Circle cx={points[0].x} cy={points[0].y} r={4} fill={Colors.background} stroke={color} strokeWidth={2} />

        {/* Target point (last) */}
        <Circle cx={lastPt.x} cy={lastPt.y} r={5} fill={color} stroke={Colors.background} strokeWidth={2} />
      </Svg>
    </View>
  );
}

interface BodyChartProps {
  currentWeight: number;
  targetWeight: number;
  goal: 'lose' | 'gain' | 'maintain';
  height: number;
  age: number;
  gender: 'male' | 'female';
}

export default function BodyChart({ currentWeight, targetWeight, goal, height, gender }: BodyChartProps) {
  // Predict 6 months of body composition changes
  const months = ['현재', '1개월', '2개월', '3개월', '4개월', '5개월', '6개월'];

  // Calculate body fat % estimate (Navy method approximation)
  const bmi = currentWeight / ((height / 100) ** 2);
  const currentBodyFat = gender === 'male'
    ? Math.max(5, Math.min(40, bmi * 1.2 - 10.8))
    : Math.max(10, Math.min(50, bmi * 1.2 - 1.8));

  const currentMuscleMass = currentWeight * (1 - currentBodyFat / 100) * 0.45;

  // Generate predictions based on goal
  const weightData: DataPoint[] = [];
  const bodyFatData: DataPoint[] = [];
  const muscleMassData: DataPoint[] = [];

  for (let i = 0; i <= 6; i++) {
    const progress = i / 6;
    let w: number, bf: number, mm: number;

    if (goal === 'lose') {
      // Steady weight loss, body fat reduction, slight muscle gain
      w = currentWeight + (targetWeight - currentWeight) * progress;
      bf = currentBodyFat - (currentBodyFat * 0.25 * progress);
      mm = currentMuscleMass + (currentMuscleMass * 0.05 * progress);
    } else if (goal === 'gain') {
      // Gradual weight gain, muscle increase, slight fat reduction
      w = currentWeight + (targetWeight - currentWeight) * progress;
      bf = currentBodyFat - (currentBodyFat * 0.1 * progress);
      mm = currentMuscleMass + (currentMuscleMass * 0.15 * progress);
    } else {
      // Maintain weight, recomposition
      w = currentWeight + (Math.random() - 0.5) * 0.5;
      bf = currentBodyFat - (currentBodyFat * 0.15 * progress);
      mm = currentMuscleMass + (currentMuscleMass * 0.08 * progress);
    }

    weightData.push({ label: months[i], value: Math.round(w * 10) / 10 });
    bodyFatData.push({ label: months[i], value: Math.round(bf * 10) / 10 });
    muscleMassData.push({ label: months[i], value: Math.round(mm * 10) / 10 });
  }

  return (
    <View>
      <ChartLine
        data={weightData}
        color={Colors.primary}
        label="체중 변화"
        unit="kg"
        icon="⚖️"
      />
      <ChartLine
        data={bodyFatData}
        color={Colors.accent}
        label="체지방률"
        unit="%"
        icon="🔥"
      />
      <ChartLine
        data={muscleMassData}
        color="#60A5FA"
        label="근육량"
        unit="kg"
        icon="💪"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chartIcon: { fontSize: 18 },
  chartLabel: { fontSize: FontSize.sm, fontWeight: '700', flex: 1 },
  chartCurrent: { fontSize: FontSize.xs, color: Colors.textSecondary },
});
