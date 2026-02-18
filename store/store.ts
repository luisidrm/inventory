import { authSlice } from '@/app/login/_slices/authSlice';
import { configureStore } from '@reduxjs/toolkit';
import {type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import your reducers here
// import exampleReducer from './slices/exampleSlice';

export const store = configureStore({
  reducer: {
    // Add your reducers here
    // example: exampleReducer,
    auth: authSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks for usage in components
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;