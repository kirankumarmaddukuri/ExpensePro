import React from 'react';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import App from './App.jsx';

export function Root() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}
