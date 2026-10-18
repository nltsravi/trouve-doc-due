import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Typography } from '../../theme/colors';

interface ConfidencePillProps {
  score: number; // 0.0 - 1.0
  compact?: boolean;
}

export const ConfidencePill: React.FC<ConfidencePillProps> = ({ score, compact = false }) => {
  const percent = Math.round(score * 100);

  let label = 'Low confidence';
  let bgColor = 'rgba(148, 163, 184, 0.15)';
  let textColor = '#94A3B8';
  let dotColor = '#94A3B8';

  if (score >= 0.85) {
    label = 'High confidence';
    bgColor = Colors.successLight;
    textColor = Colors.success;
    dotColor = Colors.success;
  } else if (score >= 0.6) {
    label = 'Please verify';
    bgColor = Colors.warningLight;
    textColor = Colors.warning;
    dotColor = Colors.warning;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, compact && styles.compactContainer]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.text, { color: textColor }]}>
        {compact ? `${percent}%` : `${label} (${percent}%)`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 5,
  },
  compactContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
