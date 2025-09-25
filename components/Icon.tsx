
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

interface IconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  style?: any;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, style, color = '#000000' }) => {
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
};

export default Icon;
