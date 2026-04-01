import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

export function useDrawerActions() {
  const navigation = useNavigation();

  return {
    openDrawer: () => navigation.dispatch(DrawerActions.openDrawer()),
    closeDrawer: () => navigation.dispatch(DrawerActions.closeDrawer()),
    toggleDrawer: () => navigation.dispatch(DrawerActions.toggleDrawer()),
  };
}

