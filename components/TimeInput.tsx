
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeContext } from './ThemeProvider';

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'เลือกเวลา'
}) => {
  const { colors } = useThemeContext();
  const [showPicker, setShowPicker] = useState(false);

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowPicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
  };

  const getTimeFromString = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
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
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value ? getTimeFromString(value) : new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};
