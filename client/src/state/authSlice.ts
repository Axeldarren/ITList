import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from './api';

// Define the shape of the authentication state
interface AuthState {
    user: User | null;
    token: string | null;
}

// Set the initial state for when the app loads
const initialState: AuthState = {
    user: null,
    token: null,
};

// Create the slice with reducers to handle login and logout
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Action to set the user's credentials after a successful login
        setCredentials: (
            state,
            { payload: { user, token } }: PayloadAction<{ user: User; token: string }>
        ) => {
            state.user = user;
            state.token = token;
        },
        // Action to clear credentials on logout
        logOut: (state) => {
            state.user = null;
            state.token = null;
        },
    },
});

export const { setCredentials, logOut } = authSlice.actions;

export default authSlice.reducer;

// Selectors to easily access auth state in components
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectCurrentToken = (state: { auth: AuthState }) => state.auth.token;