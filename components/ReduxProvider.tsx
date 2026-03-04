'use client';

import { Provider } from 'react-redux';
import { persistor, store } from '../store/store';
import { PersistGate } from 'redux-persist/integration/react';
import { AuthRestore } from './AuthRestore';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <>
          <AuthRestore />
          {children}
        </>
      </PersistGate>
    </Provider>
  );
}