import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('mydb.db');

export const initDatabase = () => {
  db.transaction(tx => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)'
    );
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, name TEXT, price REAL, description TEXT, shop TEXT)'
    );
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS shopping_list (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, productId INTEGER, productName TEXT, price REAL, shop TEXT, quantity INTEGER, purchased INTEGER)'
    );
  });
};

export const executeSql = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        query,
        params,
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export default db;