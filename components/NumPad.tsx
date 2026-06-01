import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';

interface NumPadProps {
  onPress: (digit: string) => void;
  onDelete: () => void;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

export default function NumPad({ onPress, onDelete }: NumPadProps) {
  return (
    <View style={styles.pad}>
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key, ki) => {
            if (key === '') {
              return <View key={ki} style={styles.emptyKey} />;
            }
            if (key === 'del') {
              return (
                <TouchableOpacity
                  key={ki}
                  style={styles.key}
                  onPress={onDelete}
                  activeOpacity={0.6}
                >
                  <Feather name="delete" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={ki}
                style={styles.key}
                onPress={() => onPress(key)}
                activeOpacity={0.6}
              >
                <Text style={styles.keyText}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    width: '100%',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  key: {
    flex: 1,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  emptyKey: {
    flex: 1,
    height: 64,
  },
  keyText: {
    color: Colors.text.primary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.medium,
  },
});
