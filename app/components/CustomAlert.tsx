import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { useUserStore } from '../store/userStore';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'] | React.ComponentProps<typeof Ionicons>['name'];
  iconType?: 'Feather' | 'Ionicons';
  iconColor?: string;
  showConfirm?: boolean;
  confirmText?: string;
  onConfirm?: () => void;
}

const { width } = Dimensions.get('window');

export default function CustomAlert({
  visible,
  title,
  message,
  onClose,
  icon = 'info',
  iconType = 'Feather',
  iconColor = Colors.brand.bright,
  showConfirm = false,
  confirmText = 'Confirm',
  onConfirm,
}: CustomAlertProps) {
  const { isDarkMode } = useUserStore();

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBg}>
          <TouchableWithoutFeedback>
            <View style={[styles.alertContainer, !isDarkMode && styles.alertContainerLight]}>
              {/* Styled Glowing Badge Icon Box */}
              <View style={[styles.iconBox, { backgroundColor: iconColor + '12', borderColor: iconColor + '20' }]}>
                {iconType === 'Feather' ? (
                  <Feather name={icon as any} size={24} color={iconColor} />
                ) : (
                  <Ionicons name={icon as any} size={24} color={iconColor} />
                )}
              </View>

              {/* Title & Message */}
              <View style={styles.textContainer}>
                <Text style={[styles.title, !isDarkMode && styles.titleLight]}>{title}</Text>
                <Text style={[styles.message, !isDarkMode && styles.messageLight]}>{message}</Text>
              </View>

              {/* Action Buttons */}
              {showConfirm ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.halfBtn, { backgroundColor: isDarkMode ? '#1F1F35' : '#F3F4F6' }]}
                    onPress={onClose}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cancelBtnText, !isDarkMode && styles.textLightPrimary]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.halfBtn, { backgroundColor: Colors.brand.bright }]}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmBtnText}>{confirmText}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: Colors.brand.bright }]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeBtnText}>Okay</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 340,
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.xl,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[4],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  alertContainerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    fontWeight: '800',
    textAlign: 'center',
  },
  titleLight: {
    color: '#111827',
  },
  message: {
    color: Colors.text.muted,
    fontSize: Typography.size.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  messageLight: {
    color: '#4B5563',
  },
  closeBtn: {
    width: '100%',
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  halfBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#9CA3AF',
    fontSize: Typography.size.sm,
    fontWeight: '800',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: '800',
  },
  textLightPrimary: {
    color: '#111827',
  },
});
