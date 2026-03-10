import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { DetailsScreen } from '../screens/DetailsScreen';
import { MoreScreen } from '../screens/MoreScreen';

export type HomeStackParamList = {
  Home: undefined;
  Details: undefined;
};

export type MoreStackParamList = {
  More: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  MoreTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <HomeStack.Screen name="Details" component={DetailsScreen} options={{ title: 'Details' }} />
    </HomeStack.Navigator>
  );
}

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator>
      <MoreStack.Screen name="More" component={MoreScreen} options={{ title: 'More' }} />
    </MoreStack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="MoreTab" component={MoreStackNavigator} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}

