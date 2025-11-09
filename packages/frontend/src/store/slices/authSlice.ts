import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api, getErrorMessage } from '@services/api';
import {
  type RegisterRequest,
  type LoginRequest,
  type AuthResponse,
  type UserPublicData,
} from '@password_manager/shared';
import {
  deriveMasterPasswordHash,
  deriveEncryptionKey,
  generateSalt,
  generateKeyPair,
  encryptPrivateKey,
} from '@utils/crypto';

/**
 * Auth Slice
 */

export interface AuthState {
  user: UserPublicData | null;
  isAuthenticated: boolean;
  encryptionKey: string | null;
  encryptedPrivateKey: string | null;
  salt: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  encryptionKey: null,
  encryptedPrivateKey: null,
  salt: null,
  isLoading: false,
  error: null,
};

/**
 * Register new user
*/
export const register = createAsyncThunk(
  'auth/register',
  async (
    { email, masterPassword }: { email: string; masterPassword: string },
    { rejectWithValue }
  ) => {
    try {
      // Generate salt
      const salt = generateSalt();

      // Derive encryption key and password hash
      const [encryptionKey, masterPasswordHash] = await Promise.all([
        deriveEncryptionKey(masterPassword, salt),
        deriveMasterPasswordHash(masterPassword, salt),
      ]);

      // Generate RSA key pair
      const { publicKey, privateKey } = await generateKeyPair();

      // Encrypt private key
      const { ciphertext: encryptedPrivateKey, iv } = await encryptPrivateKey(
        privateKey,
        encryptionKey
      );

      const encryptedPrivateKeyWithIV = `${iv}:${encryptedPrivateKey}`;

      // Send registration request
      const registerData: RegisterRequest = {
        email,
        masterPasswordHash,
        encryptedPrivateKey: encryptedPrivateKeyWithIV,
        publicKey,
        salt,
      };

      const response = await api.post<{ success: boolean; data: AuthResponse }>(
        '/api/auth/register',
        registerData
      );

      const { user, accessToken, encryptedPrivateKey: serverEncPrivKey, salt: serverSalt } =
        response.data.data;

      localStorage.setItem('accessToken', accessToken);

      return {
        user,
        encryptionKey,
        encryptedPrivateKey: serverEncPrivKey,
        salt: serverSalt,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/**
 * Login user (WITH PROPER SALT FETCHING)
 */
export const login = createAsyncThunk(
  'auth/login',
  async (
    { email, masterPassword }: { email: string; masterPassword: string },
    { rejectWithValue }
  ) => {
    try {
      // Step 1: Get salt from server
      const saltResponse = await api.post<{
        success: boolean;
        data: { salt: string };
      }>('/api/auth/get-salt', { email });

      const { salt } = saltResponse.data.data;

      // Step 2: Derive master password hash with salt
      const masterPasswordHash = await deriveMasterPasswordHash(masterPassword, salt);

      // Step 3: Send login request
      const loginData: LoginRequest = {
        email,
        masterPasswordHash,
      };

      const response = await api.post<{ success: boolean; data: AuthResponse }>(
        '/api/auth/login',
        loginData
      );

      const { user, accessToken, encryptedPrivateKey, salt: serverSalt } =
        response.data.data;

      localStorage.setItem('accessToken', accessToken);

      // Step 4: Derive encryption key
      const encryptionKey = await deriveEncryptionKey(masterPassword, serverSalt);

      return {
        user,
        encryptionKey,
        encryptedPrivateKey,
        salt: serverSalt,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/**
 * Logout user
 */
export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/api/auth/logout');
  } catch (error) {
    // Logout locally even if server request fails
  }
  localStorage.removeItem('accessToken');
  return null;
});

/**
 * Get current user
 */
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{
        success: boolean;
        data: { user: UserPublicData };
      }>('/api/auth/me');

      return response.data.data.user;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setEncryptionKey: (state, action: PayloadAction<string>) => {
      state.encryptionKey = action.payload;
    },
    clearEncryptionKey: (state) => {
      state.encryptionKey = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.encryptionKey = action.payload.encryptionKey;
        state.encryptedPrivateKey = action.payload.encryptedPrivateKey;
        state.salt = action.payload.salt;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.encryptionKey = action.payload.encryptionKey;
        state.encryptedPrivateKey = action.payload.encryptedPrivateKey;
        state.salt = action.payload.salt;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder.addCase(logout.fulfilled, () => initialState);

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setEncryptionKey, clearEncryptionKey } = authSlice.actions;
export default authSlice.reducer;