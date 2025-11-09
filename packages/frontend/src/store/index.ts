import { configureStore } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import vaultReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vault: vaultReducer,
  },
  
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setEncryptionKey'],
        ignoredActionPaths: ['payload.encryptionKey'],
        ignoredPaths: ['auth.encryptionKey'],
      },
    }),
  
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;