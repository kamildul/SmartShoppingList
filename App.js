import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import db, { initDatabase } from './db/init';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './providers/AuthContext';
import LoginScreen from './components/login';
import RegistrationScreen from './components/register';
import DashboardScreen from './components/dashboard';
import ProductsScreen from './components/products.js';

const Stack = createStackNavigator();

export default function App() {

  useEffect(() => {
    initDatabase();
  }, []);

  const checkSession = async ({ navigation, redirectToDashboard }) => {
    try {
      const session = await AsyncStorage.getItem('session');
      if (session) {
        if (redirectToDashboard) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Dashboard' }],
          });
        }
      } else {
        if (!redirectToDashboard) {
          navigation.navigate('Login');
        }
      }
    } catch (error) {
      console.error('Błąd podczas sprawdzania sesji:', error);
    }
  };

 return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ title: 'Logowanie' }} 
            initialParams={{ checkSession: checkSession, redirectToDashboard: true }}
          />
          <Stack.Screen 
            name="Registration" 
            component={RegistrationScreen} 
            options={{ title: 'Rejestracja' }} 
            initialParams={{ checkSession: checkSession, redirectToDashboard: true }}
          />
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ title: 'Moja lista zakupów' }} 
            initialParams={{ checkSession: checkSession, redirectToDashboard: false }}
          />
          <Stack.Screen 
            name="Products" 
            component={ProductsScreen} 
            options={{ title: 'Moje produkty' }} 
            initialParams={{ checkSession: checkSession, redirectToDashboard: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
