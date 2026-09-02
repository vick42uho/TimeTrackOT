import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { BORDER_RADIUS } from '@/theme/globals';
import { memo } from 'react';
import {
  Platform,
  TextProps as RNTextProps,
  TextStyle,
  ViewProps as RNViewProps,
  ViewStyle,
} from 'react-native';

interface CardProps extends RNViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card = memo(function Card({
  children,
  style,
  ...props
}: CardProps) {
  const cardColor = useColor('card');

  return (
    <View
      style={[
        {
          width: '100%',
          backgroundColor: cardColor,
          borderRadius: 28,
          padding: 18,
          borderWidth: 0,
          ...Platform.select({
            ios: {
              shadowColor: '#64748b',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.05,
              shadowRadius: 20,
            },
            android: {
              elevation: 0,
            },
            default: {
              shadowColor: '#64748b',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.05,
              shadowRadius: 20,
            },
          }),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
});

interface CardHeaderProps extends RNViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader = memo(function CardHeader({
  children,
  style,
  ...props
}: CardHeaderProps) {
  return (
    <View style={[{ marginBottom: 8 }, style]} {...props}>
      {children}
    </View>
  );
});

interface CardTitleProps extends RNTextProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const CardTitle = memo(function CardTitle({
  children,
  style,
  ...props
}: CardTitleProps) {
  return (
    <Text
      variant='title'
      style={[
        {
          marginBottom: 4,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
});

interface CardDescriptionProps extends RNTextProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const CardDescription = memo(function CardDescription({
  children,
  style,
  ...props
}: CardDescriptionProps) {
  return (
    <Text variant='caption' style={[style]} {...props}>
      {children}
    </Text>
  );
});

interface CardContentProps extends RNViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardContent = memo(function CardContent({
  children,
  style,
  ...props
}: CardContentProps) {
  return (
    <View style={[style]} {...props}>
      {children}
    </View>
  );
});

interface CardFooterProps extends RNViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardFooter = memo(function CardFooter({
  children,
  style,
  ...props
}: CardFooterProps) {
  return (
    <View
      style={[
        {
          marginTop: 16,
          flexDirection: 'row',
          gap: 8,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
});
