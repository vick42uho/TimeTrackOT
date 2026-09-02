import { Icon } from '@/components/ui/icon';
import { ButtonSpinner, SpinnerVariant } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { useHaptics } from '@/hooks/useHaptics';
import { CORNERS, FONT_SIZE, HEIGHT } from '@/theme/globals';
import { LucideProps } from 'lucide-react-native';
import React, { forwardRef } from 'react';
import {
  Platform,
  Pressable,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'success'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label?: string;
  children?: React.ReactNode;
  animation?: boolean;
  haptic?: boolean;
  icon?: React.ComponentType<LucideProps>;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  loadingVariant?: SpinnerVariant;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
}

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      children,
      icon,
      onPress,
      variant = 'default',
      size = 'default',
      disabled = false,
      loading = false,
      animation = true,
      haptic = true,
      loadingVariant = 'default',
      style,
      textStyle,
      label,
      ...props
    },
    ref
  ) => {
    const feedback = useHaptics(haptic);
    const primaryColor = useColor('primary');
    const primaryForegroundColor = useColor('primaryForeground');
    const secondaryColor = useColor('secondary');
    const secondaryForegroundColor = useColor('secondaryForeground');
    const destructiveColor = useColor('red');
    const destructiveForegroundColor = useColor('destructiveForeground');
    const greenColor = useColor('green');
    const borderColor = useColor('border');

    // Animation values for liquid glass effect
    const scale = useSharedValue(1);
    const brightness = useSharedValue(1);

    const textColor = useColor('text');
    const cardColor = useColor('card');

    const getButtonStyle = (): ViewStyle => {
      const baseStyle: ViewStyle = {
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0,
      };

      // Size variants
      switch (size) {
        case 'sm':
          Object.assign(baseStyle, { minHeight: 38, paddingVertical: 6, paddingHorizontal: 16 });
          break;
        case 'lg':
          Object.assign(baseStyle, { minHeight: 52, paddingVertical: 12, paddingHorizontal: 24 });
          break;
        case 'icon':
          Object.assign(baseStyle, {
            height: HEIGHT,
            width: HEIGHT,
            paddingHorizontal: 0,
            borderRadius: 999,
          });
          break;
        default:
          Object.assign(baseStyle, { minHeight: 46, paddingVertical: 10, paddingHorizontal: 20 });
      }

      // Variant styles
      switch (variant) {
        case 'destructive':
          return {
            ...baseStyle,
            backgroundColor: destructiveColor,
            borderWidth: 0,
            ...Platform.select({
              ios: {
                shadowColor: destructiveColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.28,
                shadowRadius: 10,
              },
              android: {
                elevation: 0,
              },
            }),
          };
        case 'success':
          return {
            ...baseStyle,
            backgroundColor: greenColor,
            borderWidth: 0,
            ...Platform.select({
              ios: {
                shadowColor: greenColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
              },
              android: {
                elevation: 0,
              },
            }),
          };
        case 'outline':
          return {
            ...baseStyle,
            backgroundColor: cardColor,
            borderWidth: 0,
            ...Platform.select({
              ios: {
                shadowColor: '#64748b',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
              },
              android: {
                elevation: 0,
              },
            }),
          };
        case 'secondary':
          return {
            ...baseStyle,
            backgroundColor: secondaryColor,
            borderWidth: 0,
            ...Platform.select({
              android: {
                elevation: 0,
              },
            }),
          };
        case 'ghost':
          return { ...baseStyle, backgroundColor: 'transparent', borderWidth: 0 };
        case 'link':
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 0,
            height: 'auto',
            paddingHorizontal: 0,
          };
        default:
          return {
            ...baseStyle,
            backgroundColor: primaryColor,
            borderWidth: 0,
            ...Platform.select({
              ios: {
                shadowColor: primaryColor,
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.28,
                shadowRadius: 12,
              },
              android: {
                elevation: 0,
              },
            }),
          };
      }
    };

    const getButtonTextStyle = (): TextStyle => {
      const baseTextStyle: TextStyle = {
        fontSize: size === 'sm' ? 13 : 15,
        fontWeight: '700',
        fontFamily: 'Sarabun_700Bold',
      };

      switch (variant) {
        case 'destructive':
          return { ...baseTextStyle, color: destructiveForegroundColor };
        case 'success':
          return { ...baseTextStyle, color: destructiveForegroundColor };
        case 'outline':
          return { ...baseTextStyle, color: textColor };
        case 'secondary':
          return { ...baseTextStyle, color: textColor };
        case 'ghost':
          return { ...baseTextStyle, color: primaryColor };
        case 'link':
          return {
            ...baseTextStyle,
            color: primaryColor,
            textDecorationLine: 'underline',
          };
        default:
          return { ...baseTextStyle, color: primaryForegroundColor };
      }
    };

    const getColor = (): string => {
      switch (variant) {
        case 'destructive':
          return destructiveForegroundColor;
        case 'success':
          return destructiveForegroundColor;
        case 'outline':
          return textColor;
        case 'secondary':
          return textColor;
        case 'ghost':
          return primaryColor;
        case 'link':
          return primaryColor;
        default:
          return primaryForegroundColor;
      }
    };

    // Helper function to get icon size based on button size
    const getIconSize = (): number => {
      switch (size) {
        case 'sm':
          return 16;
        case 'lg':
          return 24;
        case 'icon':
          return 20;
        default:
          return 18;
      }
    };

    // Trigger haptic feedback
    const triggerHapticFeedback = () => {
      if (!disabled && !loading) {
        feedback('impact-light');
      }
    };

    // Improved animation handlers for liquid glass effect.
    // These are deliberately not worklets: Pressable dispatches them on the JS
    // thread, and both the haptic call and `props.onPressIn` are JS-only.
    // Writing to a shared value from JS is fine — Reanimated still runs the
    // spring on the UI thread.
    const handlePressIn = (ev?: any) => {
      // Trigger haptic feedback
      triggerHapticFeedback();

      // Scale up with bouncy spring animation
      scale.value = withSpring(1.05, {
        damping: 15,
        stiffness: 400,
        mass: 0.5,
      });

      // Slight brightness increase for glass effect
      brightness.value = withSpring(1.1, {
        damping: 20,
        stiffness: 300,
      });

      // Call original onPressIn if provided
      props.onPressIn?.(ev);
    };

    const handlePressOut = (ev?: any) => {
      // Return to original size with smooth spring
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 400,
        mass: 0.8,
        overshootClamping: false,
      });

      // Return brightness to normal
      brightness.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });

      // Call original onPressOut if provided
      props.onPressOut?.(ev);
    };

    // Handle actual press action
    const handlePress = () => {
      if (onPress && !disabled && !loading) {
        onPress();
      }
    };

    // Handle press for TouchableOpacity (non-animated version)
    const handleTouchablePress = () => {
      triggerHapticFeedback();
      handlePress();
    };

    // Animated styles using useAnimatedStyle
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
        opacity: brightness.value * (disabled ? 0.5 : 1),
      };
    });

    // Extract flex value from style prop
    const getFlexFromStyle = () => {
      if (!style) return null;

      const styleArray = Array.isArray(style) ? style : [style];

      // Find the last occurrence of flex (in case of multiple styles with flex)
      for (let i = styleArray.length - 1; i >= 0; i--) {
        const s = styleArray[i];
        if (s && typeof s === 'object' && 'flex' in s) {
          return s.flex;
        }
      }
      return null;
    };

    // Alternative simpler solution - replace flex with alignSelf
    const getPressableStyle = (): ViewStyle => {
      const flexValue = getFlexFromStyle();
      // If flex: 1 is applied, use alignSelf: 'stretch' instead to only affect width
      return flexValue === 1
        ? {
            flex: 1,
            alignSelf: 'stretch',
          }
        : flexValue !== null
          ? {
              flex: flexValue,
            }
          : {};
    };

    // Updated getStyleWithoutFlex function
    const getStyleWithoutFlex = () => {
      if (!style) return style;

      const styleArray = Array.isArray(style) ? style : [style];
      return styleArray.map((s) => {
        if (s && typeof s === 'object' && 'flex' in s) {
          const { flex, ...restStyle } = s;
          return restStyle;
        }
        return s;
      });
    };

    const buttonStyle = getButtonStyle();
    const finalTextStyle = getButtonTextStyle();
    const contentColor = getColor();
    const iconSize = getIconSize();
    const styleWithoutFlex = getStyleWithoutFlex();
    const isReactElement = React.isValidElement(children);
    const contentText = label || (!isReactElement && children !== null && children !== undefined ? children : null);

    return animation ? (
      <Pressable
        ref={ref}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={getPressableStyle()}
        accessibilityRole='button'
        accessibilityState={{ busy: loading, disabled: disabled || loading }}
        accessibilityLabel={label || (typeof children === 'string' ? children : undefined)}
        {...props}
      >
        <Animated.View style={[animatedStyle, buttonStyle, styleWithoutFlex]}>
          {loading ? (
            <ButtonSpinner
              size={size}
              variant={loadingVariant}
              color={contentColor}
            />
          ) : contentText ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              {icon && (
                <Icon name={icon} color={contentColor} size={iconSize} />
              )}
              <Text style={[finalTextStyle, textStyle]}>{contentText}</Text>
            </View>
          ) : (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              {icon && (
                <Icon name={icon} color={contentColor} size={iconSize} />
              )}
              {children}
            </View>
          )}
        </Animated.View>
      </Pressable>
    ) : (
      <TouchableOpacity
        ref={ref}
        style={[buttonStyle, disabled && { opacity: 0.5 }, styleWithoutFlex]}
        onPress={handleTouchablePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        accessibilityRole='button'
        accessibilityState={{ busy: loading, disabled: disabled || loading }}
        accessibilityLabel={label || (typeof children === 'string' ? children : undefined)}
        {...props}
      >
        {loading ? (
          <ButtonSpinner
            size={size}
            variant={loadingVariant}
            color={contentColor}
          />
        ) : contentText ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {icon && <Icon name={icon} color={contentColor} size={iconSize} />}
            <Text style={[finalTextStyle, textStyle]}>{contentText}</Text>
          </View>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  }
);

// Add display name for better debugging
Button.displayName = 'Button';
