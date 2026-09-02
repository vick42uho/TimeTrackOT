
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useThemeContext } from './ThemeProvider';
import Icon from './Icon';

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

  const handleOpenPicker = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowPicker(true);
  };

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
          {value ? `${value} น.` : placeholder}
        </Text>
        <Icon name="time-outline" size={20} color={colors.primary} />
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
