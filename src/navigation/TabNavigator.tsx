import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { MainTabParamList } from '../types';
import { COLORS } from '../config/app';

// Importar telas
import OrdersScreen from '../screens/Orders/OrdersScreen';
import MapScreen from '../screens/Map/MapScreen';
import RouteScreen from '../screens/Route/RouteScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarLabel: 'Pedidos',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 28 : 24, color }}>📦</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 28 : 24, color }}>🗺️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Route"
        component={RouteScreen}
        options={{
          tabBarLabel: 'Rota',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 28 : 24, color }}>🚀</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;

