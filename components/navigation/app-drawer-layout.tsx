import { Drawer } from 'expo-router/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import React from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Avatar, Drawer as PaperDrawer, IconButton, List, Text, useTheme } from 'react-native-paper';

import { useThemeMode } from '@/hooks/use-theme-mode';

const drawerRoutes = [
  {
    name: 'finances/transactions',
    label: 'Transactions',
    focusedIcon: 'cash-multiple',
    unfocusedIcon: 'cash-multiple',
  },
  {
    name: 'finances/insights',
    label: 'Insights',
    focusedIcon: 'chart-line',
    unfocusedIcon: 'chart-line',
  },
] as const;

type AppDrawerContentProps = DrawerContentComponentProps & {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

function AppDrawerContent(props: AppDrawerContentProps) {
  const theme = useTheme();
  const { isFollowingSystem, mode, toggle } = useThemeMode();
  const activeRouteName = props.state.routes[props.state.index]?.name;
  const isCollapsed = props.isCollapsed ?? false;
  const showCollapseToggle = typeof props.onToggleCollapse === 'function';
  const isDark = mode === 'dark';

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.content,
        isCollapsed && styles.contentCollapsed,
        { backgroundColor: theme.colors.background },
      ]}>
      <View style={[styles.header, isCollapsed && styles.headerCollapsed]}>
        {showCollapseToggle ? (
          <IconButton
            icon="react"
            mode="contained-tonal"
            size={28}
            accessibilityLabel={isCollapsed ? 'Expand drawer' : 'Collapse drawer'}
            onPress={props.onToggleCollapse}
          />
        ) : (
          <Avatar.Icon size={44} icon="react" />
        )}
        {!isCollapsed ? (
          <View style={styles.headerText}>
            <Text variant="titleMedium">Codename Keystone</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Expo Router + Paper (MD3)
            </Text>
          </View>
        ) : null}
      </View>

      {isCollapsed ? (
        <PaperDrawer.Section showDivider={false}>
          {drawerRoutes.map((route) => {
            const isActive = activeRouteName === route.name;

            return (
              <PaperDrawer.CollapsedItem
                key={route.name}
                label={route.label}
                focusedIcon={route.focusedIcon}
                unfocusedIcon={route.unfocusedIcon}
                active={isActive}
                style={styles.drawerItemNoRadius}
                onPress={() => {
                  props.navigation.navigate(route.name as never);
                }}
              />
            );
          })}
        </PaperDrawer.Section>
      ) : (
        <List.Section style={styles.listSection}>
          <List.AccordionGroup>
            <List.Accordion
              id="nav-1"
              title="Finances"
              left={(leftProps) => <List.Icon {...leftProps} icon="wallet" />}>
              {drawerRoutes.map((route) => {
                const isActive = activeRouteName === route.name;

                return (
                  <PaperDrawer.Item
                    key={`nav-1-${route.name}`}
                    label={route.label}
                    icon={isActive ? route.focusedIcon : route.unfocusedIcon}
                    active={isActive}
                    style={styles.drawerItemNoRadius}
                    onPress={() => {
                      props.navigation.navigate(route.name as never);
                      props.navigation.closeDrawer();
                    }}
                  />
                );
              })}
            </List.Accordion>
          </List.AccordionGroup>
        </List.Section>
      )}

      <View style={styles.footer}>
        <PaperDrawer.Section showDivider={false}>
          {isCollapsed ? (
            <PaperDrawer.CollapsedItem
              label="Theme"
              focusedIcon={isDark ? 'weather-night' : 'white-balance-sunny'}
              unfocusedIcon={isDark ? 'weather-night' : 'white-balance-sunny'}
              active={isDark}
              style={styles.drawerItemNoRadius}
              accessibilityLabel="Toggle theme"
              onPress={toggle}
            />
          ) : (
            <PaperDrawer.Item
              label={`Theme: ${isDark ? 'Dark' : 'Light'}${isFollowingSystem ? ' (System)' : ''}`}
              icon={isDark ? 'weather-night' : 'white-balance-sunny'}
              style={styles.drawerItemNoRadius}
              onPress={toggle}
            />
          )}
        </PaperDrawer.Section>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isPermanentDrawer = isWeb && width >= 768;

  const userToggledCollapsedRef = React.useRef(false);
  const [isCollapsed, setIsCollapsed] = React.useState(() => isPermanentDrawer);

  React.useEffect(() => {
    if (isPermanentDrawer && !userToggledCollapsedRef.current) {
      setIsCollapsed(true);
    }
  }, [isPermanentDrawer]);

  const onToggleCollapse = React.useCallback(() => {
    userToggledCollapsedRef.current = true;
    setIsCollapsed((value) => !value);
  }, []);

  return (
    <Drawer
      drawerContent={(props) => (
        <AppDrawerContent
          {...props}
          isCollapsed={isPermanentDrawer && isCollapsed}
          onToggleCollapse={isPermanentDrawer ? onToggleCollapse : undefined}
        />
      )}
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: theme.colors.elevation.level2 },
        headerTintColor: theme.colors.onSurface,
        headerLeft: isPermanentDrawer
          ? () => null
          : () => (
              <IconButton
                icon="menu"
                size={24}
                accessibilityLabel="Open drawer"
                onPress={() => navigation.openDrawer()}
              />
            ),
        drawerType: isPermanentDrawer ? 'permanent' : 'front',
        swipeEnabled: !isPermanentDrawer,
        drawerStyle: {
          backgroundColor: theme.colors.background,
          width: isPermanentDrawer ? (isCollapsed ? 96 : 320) : undefined,
        },
      })}>
      <Drawer.Screen name="finances/transactions" options={{ title: 'Transactions' }} />
      <Drawer.Screen name="finances/insights" options={{ title: 'Insights' }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  contentCollapsed: {
    alignItems: 'center',
  },
  drawerItemNoRadius: {
    borderRadius: 0,
  },
  listSection: {
    marginTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  headerCollapsed: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 8,
  },
});
