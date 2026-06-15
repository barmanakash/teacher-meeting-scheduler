import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import meetingsReducer from './slices/meetingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    meetings: meetingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
