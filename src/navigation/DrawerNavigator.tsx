import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import TabNavigator from './TabNavigator';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import CustomDrawerContent from '../components/navigation/CustomDrawerContent';
import { COLORS } from '../config/app';

const Drawer = createDrawerNavigator();

const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: COLORS.surface,
          width: 300,
        },
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.textSecondary,
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{
          drawerLabel: 'Principal',
        }}
      />
      <Drawer.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          drawerLabel: 'Relatórios',
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;

