
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useThemeContext } from './ThemeProvider';
import { useTimeCalculation } from '../hooks/useTimeCalculation';
import Icon from './Icon';

interface DateInputProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'เลือกวันที่'
}) => {
  const { colors } = useThemeContext();
  const { formatDateThai } = useTimeCalculation();
  const [showPicker, setShowPicker] = useState(false);

  const handleOpenPicker = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowPicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  const getDateFromString = (dateString: string): Date => {
    if (!dateString) return new Date();
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateString);
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: 6,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
      fontFamily: 'Sarabun_600SemiBold',
    },
    input: {
      backgroundColor: colors.backgroundAlt,
      borderWidth: 0,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 13,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    inputText: {
      fontSize: 15,
      color: value ? colors.text : colors.textSecondary,
      fontFamily: 'Sarabun_600SemiBold',
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={handleOpenPicker}
        activeOpacity={0.7}
      >
        <Text style={styles.inputText}>
          {value ? formatDateThai(value) : placeholder}
        </Text>
        <Icon name="calendar-outline" size={20} color={colors.primary} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value ? getDateFromString(value) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};
