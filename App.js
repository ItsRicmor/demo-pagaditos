import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import Pagadito from './src/core/Pagadito';

export default function App() {
  const [state] = useState({ PagaditoInstance: new Pagadito('d8e75a8868b229484fd408a8d49e3575', '2e658bec66a98f8c89d0d38c7fbd6b0a') });
  const { PagaditoInstance } = state;

  const _handlePressButtonAsync = async () => {
    await PagaditoInstance.connect();
    await PagaditoInstance.exec_trans();
  }

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Button title="Open WebBrowser" onPress={_handlePressButtonAsync} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
