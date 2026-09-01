import { useColor } from '@/hooks/useColor';
import { FONT_SIZE } from '@/theme/globals';
import React, { forwardRef } from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';

type TextVariant =
  'body' | 'title' | 'subtitle' | 'caption' | 'heading' | 'link';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  lightColor?: string;
  darkColor?: string;
  children: React.ReactNode;
}

const headingVariants: TextVariant[] = ['heading', 'title', 'subtitle'];

export const Text = React.memo(
  forwardRef<RNText, TextProps>(
    (
      { variant = 'body', lightColor, darkColor, style, children, ...props },
      ref
    ) => {
      const textColor = useColor('text', {
        light: lightColor,
        dark: darkColor,
      });
      const mutedColor = useColor('textMuted');
      const defaultAccessibilityRole = headingVariants.includes(variant)
        ? 'header'
        : undefined;

      const getTextStyle = (): TextStyle => {
        const baseStyle: TextStyle = {
          color: textColor,
        };

        switch (variant) {
          case 'heading':
            return {
              ...baseStyle,
              fontSize: 26,
              fontWeight: '700',
              fontFamily: 'Sarabun_700Bold',
            };
          case 'title':
            return {
              ...baseStyle,
              fontSize: 20,
              fontWeight: '700',
              fontFamily: 'Sarabun_700Bold',
            };
          case 'subtitle':
            return {
              ...baseStyle,
              fontSize: 16,
              fontWeight: '600',
              fontFamily: 'Sarabun_600SemiBold',
            };
          case 'caption':
            return {
              ...baseStyle,
              fontSize: 13,
              fontWeight: '400',
              fontFamily: 'Sarabun_400Regular',
              color: mutedColor,
            };
          case 'link':
            return {
              ...baseStyle,
              fontSize: 15,
              fontWeight: '500',
              fontFamily: 'Sarabun_500Medium',
              textDecorationLine: 'underline',
            };
          default: // 'body'
            return {
              ...baseStyle,
              fontSize: 15,
              fontWeight: '400',
              fontFamily: 'Sarabun_400Regular',
            };
        }
      };

      return (
        <RNText
          ref={ref}
          style={[getTextStyle(), style]}
          accessibilityRole={defaultAccessibilityRole}
          {...props}
        >
          {children}
        </RNText>
      );
    }
  )
);

Text.displayName = 'Text';
