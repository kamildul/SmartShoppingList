import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TextInput, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { useAuth } from '../providers/AuthContext';
import { executeSql } from '../db/init';

const ProductsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [originalProducts, setOriginalProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    shop: ''
  });
  const [editProductId, setEditProductId] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await executeSql('SELECT * FROM products WHERE userId = ?', [user.id]);
      if (result && result.rows.length > 0) {
        const productList = [];
        for (let i = 0; i < result.rows.length; i++) {
          productList.push(result.rows.item(i));
        }
        setProducts(productList);
        setOriginalProducts(productList); 
      } else {
        setProducts([]);
        setOriginalProducts([]);
      }
    } catch (error) {
      console.error('Błąd podczas ładowania produktów:', error);
    }
  };

  const handleAddProduct = async () => {
    if (newProduct.name.trim() !== '') {
      try {
        if (editProductId) {
          await executeSql(
            'UPDATE products SET name = ?, price = ?, description = ?, shop = ? WHERE id = ?',
            [newProduct.name, newProduct.price, newProduct.description, newProduct.shop, editProductId]
          );
          setEditProductId(null); 
        } else {
 
          await executeSql(
            'INSERT INTO products (name, price, description, shop, userId) VALUES (?, ?, ?, ?, ?)',
            [newProduct.name, newProduct.price, newProduct.description, newProduct.shop, user.id]
          );
        }
        setNewProduct({
          name: '',
          price: '',
          description: '',
          shop: ''
        });
        setModalVisible(false);
        loadProducts();
      } catch (error) {
        console.error('Błąd podczas dodawania produktu:', error);
      }
    } else {
      Alert.alert('Błąd', 'Nazwa produktu jest wymagana.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await executeSql('DELETE FROM products WHERE id = ?', [productId]);
      loadProducts();
    } catch (error) {
      console.error('Błąd podczas usuwania produktu:', error);
    }
  };

  const handleEditProduct = (product) => {

    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      shop: product.shop
    });
    setEditProductId(product.id);
    setModalVisible(true); 
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text>{item.name} | {item.price} | {item.shop}</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity onPress={() => handleEditProduct(item)}>
          <Text style={styles.editButton}>Edytuj</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteProduct(item.id)}>
          <Text style={styles.deleteButton}>Usuń</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filterProducts = (searchTerm) => {
    if (searchTerm.trim() === '') {
      setProducts(originalProducts); 
    } else {
      const filtered = originalProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setProducts(filtered);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj produktu"
          value={searchTerm}
          onChangeText={(text) => {
            setSearchTerm(text);
            filterProducts(text); 
          }}
        />
        <Button title="Dodaj produkt" onPress={() => {
          setEditProductId(null); 
          setModalVisible(true);
        }} />
      </View>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text>Brak zapisanych produktów.</Text>}
      />
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
            <TextInput
              style={styles.input}
              placeholder="Nazwa produktu"
              value={newProduct.name}
              onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Cena"
              keyboardType="numeric"
              value={newProduct.price}
              onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Opis"
              value={newProduct.description}
              onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Sklep"
              value={newProduct.shop}
              onChangeText={(text) => setNewProduct({ ...newProduct, shop: text })}
            />
            <View style={styles.buttonContainer}>
              <Button title="Anuluj" onPress={() => setModalVisible(false)} />
              <Button title="Zapisz" onPress={handleAddProduct} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    color: 'blue',
    marginRight: 10,
  },
  deleteButton: {
    color: 'red',
  },
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
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    width: '100%'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});

export default ProductsScreen;
