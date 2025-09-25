
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeContext } from './ThemeProvider';
import { useTimeCalculation } from '../hooks/useTimeCalculation';

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
    return new Date(dateString);
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      fontFamily: 'Sarabun_600SemiBold',
    },
    input: {
      backgroundColor: colors.backgroundAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 48,
      justifyContent: 'center',
    },
    inputText: {
      fontSize: 16,
      color: value ? colors.text : colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.inputText}>
          {value ? formatDateThai(value) : placeholder}
        </Text>
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
