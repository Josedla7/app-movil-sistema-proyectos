import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import dayjs from 'dayjs';

interface FormDatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

export default function FormDatePicker({ label, value, onChange }: FormDatePickerProps) {
  const [show, setShow] = useState(false);
  
  const dateValue = value ? dayjs(value).toDate() : new Date();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(dayjs(selectedDate).format('YYYY-MM-DD'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={styles.trigger} 
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.valueText}>
          {dayjs(value).format('DD MMM, YYYY')}
        </Text>
        <Calendar color="#64748b" size={18} />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
    fontWeight: '600',
  },
  trigger: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueText: {
    color: '#fff',
    fontSize: 15,
  },
});
