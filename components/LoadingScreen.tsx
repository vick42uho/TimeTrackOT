
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeContext } from './ThemeProvider';

export const LoadingScreen: React.FC = () => {
  const { colors } = useThemeContext();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: 16,
      color: colors.text,
      marginTop: 16,
      fontFamily: 'Sarabun_400Regular',
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>กำลังโหลด...</Text>
    </View>
  );
};
