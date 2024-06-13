import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import db, { executeSql } from '../db/init';
import { useAuth } from '../providers/AuthContext';

const LoginScreen = ({ navigation, route }) => {

  const { setUser } = useAuth();
  const { checkSession } = route.params;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    checkSession(navigation);
  }, []);

  const generateSessionKey = () => {
    const currentDate = new Date();
    const sessionKey = 'session_' + currentDate.getTime();
    return sessionKey;
  };

  const handleLogin = async () => {
    try {
      const result = await executeSql(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password]
      );
      if (result && result.rows.length > 0) {
        const user = result.rows._array[0];
        await AsyncStorage.setItem('session', generateSessionKey());
        setUser({ id: user.id, username: user.username });
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      } else {
        Alert.alert('Błąd', 'Podane dane logowania są nieprawidłowe. Spróbuj ponownie.');
      }
    } catch (error) {
      console.error('Błąd podczas logowania:', error);
      Alert.alert('Błąd', 'Wystąpił błąd podczas logowania. Spróbuj ponownie.');
    }
  };

  const handleRegistration = () => {
    navigation.navigate('Registration');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logowanie</Text>
      <TextInput
        placeholder="Nazwa użytownika"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        placeholder="Hasło"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <View style={styles.buttonContainer}>
        <Button title="Logowanie" onPress={handleLogin} />
        <Button title="Rejestracja" onPress={handleRegistration} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
});

export default LoginScreen;
