import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import db, { executeSql } from '../db/init';

const RegistrationScreen = ({ navigation, route }) => {
  
  const { checkSession } = route.params;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    checkSession(navigation);
  }, []);

  const handleRegistration = async () => {
    
    if (!username || !password) {
      Alert.alert('Błąd', 'Nazwa użytkownika i hasło nie mogą być puste.');
      return;
    }

    try {
      const result = await executeSql(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (result.rows.length > 0) {
        Alert.alert('Błąd', 'Użytkownik o podanej nazwie już istnieje.');
      } else {
        await executeSql(
          'INSERT INTO users (username, password) VALUES (?, ?)',
          [username, password]
        );
        Alert.alert(
          'Sukces', 
          'Rejestracja przebiegła pomyślnie. Możesz się teraz zalogować.', 
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Błąd podczas rejestracji:', error);
      Alert.alert('Błąd', 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
    }
  };

  const handleLogin = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rejestracja</Text>
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
        <Button title="Zarejestruj" onPress={handleRegistration} />
        <Button title="Logowanie" onPress={handleLogin} />
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

export default RegistrationScreen;
