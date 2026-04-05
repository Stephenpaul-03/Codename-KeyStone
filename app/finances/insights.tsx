import React from 'react';

import { useNavigation } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function InsightsPage() {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open drawer"
          hitSlop={8}
          onPress={() => navigation?.openDrawer?.()}
          style={styles.headerIcon}>
          <MaterialCommunityIcons name="menu" size={22} color={theme.colors.onSurface} />
        </Pressable>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
          Insights
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={{ color: theme.colors.onSurface }}>Insights</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
