import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmActionModalProps) {
  const theme = useTheme();

  const tone = destructive
    ? {
        icon: theme.colors.error,
        iconBg: theme.colors.errorContainer,
        actionText: theme.colors.onError,
        actionBg: theme.colors.error,
      }
    : {
        icon: theme.colors.primary,
        iconBg: theme.colors.primaryContainer,
        actionText: theme.colors.onPrimary,
        actionBg: theme.colors.primary,
      };

  return (
    <Portal>
      <Dialog visible={isOpen} dismissable={false} onDismiss={onCancel} style={styles.dialog}>
        <Dialog.Title>
          <View style={styles.titleRow}>
            <View style={[styles.iconWrap, { backgroundColor: tone.iconBg }]}>
              <MaterialCommunityIcons name="alert-outline" size={18} color={tone.icon} />
            </View>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {title}
            </Text>
          </View>
        </Dialog.Title>

        <Dialog.Content>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>{message}</Text>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onCancel}>{cancelLabel}</Button>
          <Button
            onPress={onConfirm}
            buttonColor={tone.actionBg}
            textColor={tone.actionText}>
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 520,
    alignSelf: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
