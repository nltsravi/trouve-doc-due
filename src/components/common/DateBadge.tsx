import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Typography } from '../../theme/colors';
import { RecordUrgency } from '../../types/record';

interface DateBadgeProps {
  targetDate: string | null;
  urgency: RecordUrgency;
  daysRemaining: number | null;
  label?: string;
}

export const DateBadge: React.FC<DateBadgeProps> = ({
  targetDate,
  urgency,
  daysRemaining,
  label,
}) => {
  if (!targetDate) {
    return (
      <View style={[styles.container, { backgroundColor: 'rgba(148, 163, 184, 0.12)' }]}>
        <Text style={[styles.dateText, { color: '#94A3B8' }]}>No expiry date</Text>
      </View>
    );
  }

  let bg = Colors.successLight;
  let fg = Colors.success;
  let urgencyText = 'Valid';

  if (urgency === 'overdue') {
    bg = Colors.dangerLight;
    fg = Colors.danger;
    urgencyText = daysRemaining !== null ? `Expired ${Math.abs(daysRemaining)}d ago` : 'Expired';
  } else if (urgency === 'expiring_soon') {
    bg = Colors.warningLight;
    fg = Colors.warning;
    urgencyText = daysRemaining !== null ? `Expires in ${daysRemaining}d` : 'Expiring soon';
  } else if (daysRemaining !== null) {
    urgencyText = `${daysRemaining}d left`;
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.dateText, { color: fg }]}>
        {label ? `${label}: ` : ''}{targetDate}
      </Text>
      <View style={[styles.separator, { backgroundColor: fg }]} />
      <Text style={[styles.urgencyText, { color: fg }]}>
        {urgencyText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dateText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  separator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.6,
  },
  urgencyText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
