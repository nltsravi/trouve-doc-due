import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Typography } from '../../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          btn: { backgroundColor: Colors.dark.cardElevated, borderColor: Colors.dark.border },
          text: { color: Colors.dark.text },
        };
      case 'outline':
        return {
          btn: { backgroundColor: 'transparent', borderColor: Colors.primaryLight, borderWidth: 1.5 },
          text: { color: Colors.primaryLight },
        };
      case 'danger':
        return {
          btn: { backgroundColor: Colors.danger, borderColor: Colors.danger },
          text: { color: '#FFFFFF' },
        };
      case 'ghost':
        return {
          btn: { backgroundColor: 'transparent', borderColor: 'transparent' },
          text: { color: Colors.primaryLight },
        };
      case 'primary':
      default:
        return {
          btn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
          text: { color: '#FFFFFF' },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { btn: { paddingVertical: 8, paddingHorizontal: 12 }, text: { fontSize: 13 } };
      case 'lg':
        return { btn: { paddingVertical: 16, paddingHorizontal: 24 }, text: { fontSize: 16 } };
      case 'md':
      default:
        return { btn: { paddingVertical: 12, paddingHorizontal: 18 }, text: { fontSize: 14 } };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        variantStyles.btn,
        sizeStyles.btn,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text.color} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 16 : 18}
              color={variantStyles.text.color}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    ...Typography.button,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
