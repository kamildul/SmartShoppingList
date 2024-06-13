import React, { useState, useEffect } from 'react';
import { View, Text, Button, Modal, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../providers/AuthContext';
import { executeSql } from '../db/init';

const DashboardScreen = ({ navigation, route }) => {
  const { checkSession } = route.params;
  const [sessionKey, setSessionKey] = useState(null);
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [shoppingList, setShoppingList] = useState([]);

  useEffect(() => {
    checkSession(navigation);
    getSessionKey();
    fetchShoppingList();
  }, []);

  const getSessionKey = async () => {
    try {
      const session = await AsyncStorage.getItem('session');
      setSessionKey(session);
    } catch (error) {
      console.error('Błąd podczas pobierania sesji:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('session');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Błąd podczas usuwania sesji:', error);
    }
  };

  const handleNavigateToProducts = () => {
    navigation.navigate('Products');
  };

  const handleAddToShoppingList = async (productId, productName, price, shop) => {
    try {
      const quantity = quantities[productId];
      if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
        alert('Proszę wprowadzić poprawną ilość produktu.');
        return;
      }
      const existingProductIndex = shoppingList.findIndex(item => item.productId === productId);
      if (existingProductIndex !== -1) {
        const updatedShoppingList = [...shoppingList];
        updatedShoppingList[existingProductIndex].quantity += parseInt(quantity);
        await executeSql(
          'UPDATE shopping_list SET quantity = ? WHERE id = ?',
          [updatedShoppingList[existingProductIndex].quantity, updatedShoppingList[existingProductIndex].id]
        );
        setShoppingList(updatedShoppingList);
      } else {
        await executeSql(
          'INSERT INTO shopping_list (userId, productId, productName, price, shop, quantity, purchased) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [user.id, productId, productName, price, shop, quantity, 0]
        );
        fetchShoppingList();
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Błąd podczas dodawania produktu do listy zakupowej:', error);
    }
  };

  const handleTogglePurchase = async (itemId, purchased) => {
    try {
      await executeSql('UPDATE shopping_list SET purchased = ? WHERE id = ?', [purchased ? 1 : 0, itemId]);
      fetchShoppingList();
    } catch (error) {
      console.error('Błąd podczas zmiany statusu zakupu produktu:', error);
    }
  };

  const handleRemoveFromShoppingList = async (itemId) => {
    try {
      await executeSql('DELETE FROM shopping_list WHERE id = ?', [itemId]);
      fetchShoppingList();
    } catch (error) {
      console.error('Błąd podczas usuwania produktu z listy zakupowej:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const result = await executeSql('SELECT * FROM products WHERE userId = ?', [user.id]);
      if (result && result.rows.length > 0) {
        const productList = [];
        for (let i = 0; i < result.rows.length; i++) {
          const item = result.rows.item(i);
          productList.push(item);
          setQuantities(prevState => ({
            ...prevState,
            [item.id]: '1',
          }));
        }
        setProducts(productList);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Błąd podczas pobierania produktów:', error);
    }
  };

  const fetchShoppingList = async () => {
    try {
      const result = await executeSql('SELECT * FROM shopping_list WHERE userId = ? ORDER BY purchased ASC', [user.id]);
      if (result && result.rows.length > 0) {
        const shoppingListData = [];
        for (let i = 0; i < result.rows.length; i++) {
          const item = result.rows.item(i);
          shoppingListData.push(item);
        }
        setShoppingList(shoppingListData);
      } else {
        setShoppingList([]);
      }
    } catch (error) {
      console.error('Błąd podczas pobierania listy zakupów:', error);
    }
  };

  const handleFinishShopping = () => {
    Alert.alert(
      'Zakończ zakupy',
      'Czy na pewno chcesz zakończyć zakupy i usunąć wszystkie produkty z listy zakupów?',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Potwierdź',
          onPress: async () => {
            try {
              await executeSql('DELETE FROM shopping_list WHERE userId = ?', [user.id]);
              setShoppingList([]);
              alert('Lista zakupów została wyczyszczona.');
            } catch (error) {
              console.error('Błąd podczas usuwania produktów z listy zakupów:', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
        <Button style={styles.addToShoppingListButton} title="Moje produkty" onPress={handleNavigateToProducts} />
        <Button title="Wstaw produkt" onPress={() => {
          setModalVisible(true);
          fetchProducts();
        }} />
        <Button title="Wyloguj" onPress={handleLogout} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Moja lista zakupów</Text>
        <FlatList
          data={shoppingList}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ textAlign: 'center' }}>Twoja lista zakupowa jest pusta. Dodaj produkt do listy.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => handleTogglePurchase(item.id, !item.purchased)}>
                <Text style={{ textDecorationLine: item.purchased ? 'line-through' : 'none' }}>
                  {item.productName} | Cena: {item.price} | Ilość: {item.quantity}
                </Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', marginLeft: 10 }}>
                <TouchableOpacity onPress={() => handleTogglePurchase(item.id, !item.purchased)}>
                  <Text style={{ color: item.purchased ? 'green' : 'blue' }}>{item.purchased ? 'Cofnij' : 'Kupiony'}</Text>
                </TouchableOpacity>
                <View style={{ width: 10 }} />
                <TouchableOpacity onPress={() => handleRemoveFromShoppingList(item.id)}>
                  <Text style={{ color: 'red' }}>Usuń</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
        <Button title="Zakończ zakupy" onPress={handleFinishShopping} />
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.emptyListText}>Twoja lista zakupowa</Text>
            {products.length > 0 ? (
              <FlatList
                data={products}
                renderItem={({ item }) => (
                  <View style={styles.productItem}>
                    <Text>Nazwa produktu: {item.name} | Cena: {item.price} | Sklep: {item.shop}</Text>
                    <View style={styles.quantityContainer}>
                      <Text>Ilość:</Text>
                      <TextInput
                        style={styles.quantityInput}
                        onChangeText={text => setQuantities(prevState => ({ ...prevState, [item.id]: text }))}
                        value={quantities[item.id]}
                        keyboardType="numeric"
                      />
                    </View>
                    <TouchableOpacity onPress={() => handleAddToShoppingList(item.id, item.name, item.price, item.shop)}>
                      <Text style={styles.addToShoppingListButton}>Wstaw</Text>
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item) => item.id.toString()}
              />
            ) : (
              <Text style={styles.emptyListText}>Lista produktów jest pusta. Dodaj nowy produkt, aby kontynuować.</Text>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  productItem: {
    marginBottom: 20,
  },
  addToShoppingListButton: {
    color: '#30db0d',
    marginTop: 5,
  },
  emptyListText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginLeft: 10,
    paddingHorizontal: 8,
  },
});

export default DashboardScreen;
