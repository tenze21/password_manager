import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api, getErrorMessage } from '@services/api';
import {
  type RegisterRequest,
  type LoginRequest,
  type AuthResponse,
  type UserPublicData,
  type TwoFactorMethod,
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

interface AuthState {
  user: UserPublicData | null;
  isAuthenticated: boolean;
  encryptionKey: string | null;
  encryptedPrivateKey: string | null;
  salt: string | null;
  isLoading: boolean;
  error: string | null;

  // 2FA state
  requires2FA: boolean;
  twoFactorMethod: TwoFactorMethod | null;
  pendingLoginData: { email: string; masterPassword: string } | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  encryptionKey: null,
  encryptedPrivateKey: null,
  salt: null,
  isLoading: false,
  error: null,
  requires2FA: false,
  twoFactorMethod: null,
  pendingLoginData: null,
};

// ... register thunk remains the same ...

export const register = createAsyncThunk(
  'auth/register',
  async (
    { email, masterPassword }: { email: string; masterPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const salt = generateSalt();
      const [encryptionKey, masterPasswordHash] = await Promise.all([
        deriveEncryptionKey(masterPassword, salt),
        deriveMasterPasswordHash(masterPassword, salt),
      ]);

      const { publicKey, privateKey } = await generateKeyPair();
      const { ciphertext: encryptedPrivateKey, iv } = await encryptPrivateKey(
        privateKey,
        encryptionKey
      );

      const encryptedPrivateKeyWithIV = `${iv}:${encryptedPrivateKey}`;

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
 * Login user (Step 1: Credentials)
 */
export const login = createAsyncThunk<
  {
    user: UserPublicData;
    encryptionKey: string;
    encryptedPrivateKey: string;
    salt: string;
    requires2FA: false;
  }
  | {
    requires2FA: true;
    method: TwoFactorMethod;
    email: string;
    masterPassword: string;
  },
  { email: string; masterPassword: string },
  { rejectValue: string }
>(
  'auth/login',
  async (
    { email, masterPassword }: { email: string; masterPassword: string },
    { rejectWithValue }
  ) => {
    try {
      // Get salt from server
      const saltResponse = await api.post<{
        success: boolean;
        data: { salt: string };
      }>('/api/auth/get-salt', { email });

      const { salt } = saltResponse.data.data;

      // Derive master password hash
      const masterPasswordHash = await deriveMasterPasswordHash(masterPassword, salt);

      // Send login request (without 2FA code first)
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

      // Derive encryption key
      const encryptionKey = await deriveEncryptionKey(masterPassword, serverSalt);

      return {
        user,
        encryptionKey,
        encryptedPrivateKey,
        salt: serverSalt,
        requires2FA: false,
      };
    } catch (error: any) {
      // Check if error is 2FA required
      if (error?.response?.data?.error?.code === 'TWO_FACTOR_REQUIRED') {
        // Return special payload indicating 2FA is needed
        console.log(error.response.data.error.method);
        return {
          requires2FA: true,
          method: error.response.data.error.method || 'email',
          email,
          masterPassword,
        };
      }

      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/**
 * Login with 2FA code (Step 2: 2FA Verification)
 */
export const loginWith2FA = createAsyncThunk(
  'auth/loginWith2FA',
  async (
    { twoFactorCode }: { twoFactorCode: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const { pendingLoginData } = state.auth;

      if (!pendingLoginData) {
        return rejectWithValue('No pending login data');
      }

      const { email, masterPassword } = pendingLoginData;

      // Get salt again
      const saltResponse = await api.post<{
        success: boolean;
        data: { salt: string };
      }>('/api/auth/get-salt', { email });

      const { salt } = saltResponse.data.data;

      // Derive master password hash
      const masterPasswordHash = await deriveMasterPasswordHash(masterPassword, salt);

      // Send login request WITH 2FA code
      const loginData: LoginRequest = {
        email,
        masterPasswordHash,
        twoFactorCode,
      };

      const response = await api.post<{ success: boolean; data: AuthResponse }>(
        '/api/auth/login',
        loginData
      );

      const { user, accessToken, encryptedPrivateKey, salt: serverSalt } =
        response.data.data;

      localStorage.setItem('accessToken', accessToken);

      // Derive encryption key
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
    cancel2FA: (state) => {
      state.requires2FA = false;
      state.twoFactorMethod = null;
      state.pendingLoginData = null;
      state.error = null;
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

    // Login (Step 1)
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.requires2FA) {
          // 2FA required - show verification screen
          state.requires2FA = true;
          state.twoFactorMethod = action.payload.method;
          state.pendingLoginData = {
            email: action.payload.email,
            masterPassword: action.payload.masterPassword,
          };
        } else {
          // Direct login success
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.encryptionKey = action.payload.encryptionKey;
          state.encryptedPrivateKey = action.payload.encryptedPrivateKey;
          state.salt = action.payload.salt;
        }
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Login with 2FA (Step 2)
    builder
      .addCase(loginWith2FA.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWith2FA.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.encryptionKey = action.payload.encryptionKey;
        state.encryptedPrivateKey = action.payload.encryptedPrivateKey;
        state.salt = action.payload.salt;
        state.requires2FA = false;
        state.twoFactorMethod = null;
        state.pendingLoginData = null;
        state.error = null;
      })
      .addCase(loginWith2FA.rejected, (state, action) => {
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

export const { clearError, setEncryptionKey, clearEncryptionKey, cancel2FA } = authSlice.actions;
export default authSlice.reducer;