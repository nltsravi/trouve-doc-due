import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Typography } from '../../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: Colors.primaryGhost, text: Colors.primaryLight };
      case 'success':
        return { bg: Colors.successLight, text: Colors.success };
      case 'warning':
        return { bg: Colors.warningLight, text: Colors.warning };
      case 'danger':
        return { bg: Colors.dangerLight, text: Colors.danger };
      case 'info':
        return { bg: Colors.infoLight, text: Colors.info };
      case 'neutral':
      default:
        return { bg: 'rgba(148, 163, 184, 0.12)', text: '#94A3B8' };
    }
  };

  const { bg, text } = getColors();
  const isSm = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSm && styles.badgeSm, style]}>
      <Text style={[styles.text, { color: text }, isSm && styles.textSm]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    ...Typography.caption,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
    lineHeight: 12,
  },
});
