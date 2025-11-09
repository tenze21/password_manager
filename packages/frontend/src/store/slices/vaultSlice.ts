import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api, getErrorMessage } from '@services/api';
import {
  type PasswordEntry,
  type DecryptedPasswordEntry,
  type CreatePasswordEntryInput,
  type UpdatePasswordEntryInput,
} from '@password_manager/shared';
import { encryptField, decryptField } from '@utils/crypto';
import { type RootState } from '@store/index';

/**
 * Vault Slice
 */

interface VaultState {
  encryptedEntries: PasswordEntry[];
  decryptedEntries: DecryptedPasswordEntry[];
  selectedEntry: DecryptedPasswordEntry | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  searchQuery: string;
  filterFolder: string | null;
}

const initialState: VaultState = {
  encryptedEntries: [],
  decryptedEntries: [],
  selectedEntry: null,
  isLoading: false,
  isSaving: false,
  error: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  searchQuery: '',
  filterFolder: null,
};

// Helper functions
async function decryptEntry(
  entry: PasswordEntry,
  encryptionKey: string
): Promise<DecryptedPasswordEntry> {
  const [username, password, notes] = await Promise.all([
    decryptField(entry.encryptedUsername, encryptionKey),
    decryptField(entry.encryptedPassword, encryptionKey),
    entry.encryptedNotes
      ? decryptField(entry.encryptedNotes, encryptionKey)
      : Promise.resolve(undefined),
  ]);

  return {
    id: entry.id,
    websiteUrl: entry.websiteUrl || undefined,
    websiteName: entry.websiteName,
    username,
    password,
    notes,
    folder: entry.folder || undefined,
    favorite: entry.favorite,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

async function encryptEntryData(
  data: {
    websiteName: string;
    websiteUrl?: string;
    username: string;
    password: string;
    notes?: string;
    folder?: string;
    favorite?: boolean;
  },
  encryptionKey: string
): Promise<CreatePasswordEntryInput> {
  const [encryptedUsername, encryptedPassword, encryptedNotes] = await Promise.all([
    encryptField(data.username, encryptionKey),
    encryptField(data.password, encryptionKey),
    data.notes ? encryptField(data.notes, encryptionKey) : Promise.resolve(undefined),
  ]);

  return {
    websiteName: data.websiteName,
    websiteUrl: data.websiteUrl,
    encryptedUsername,
    encryptedPassword,
    encryptedNotes,
    folder: data.folder,
    favorite: data.favorite || false,
  };
}

// Async thunks
export const fetchPasswordEntries = createAsyncThunk(
  'vault/fetchPasswordEntries',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const encryptionKey = state.auth.encryptionKey;

      if (!encryptionKey) {
        return rejectWithValue('Encryption key not available');
      }

      const response = await api.get<{
        success: boolean;
        data: { entries: PasswordEntry[] };
      }>('/api/vault');

      const encryptedEntries = response.data.data.entries;
      const decryptedEntries = await Promise.all(
        encryptedEntries.map((entry) => decryptEntry(entry, encryptionKey))
      );

      return { encryptedEntries, decryptedEntries };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createPasswordEntry = createAsyncThunk(
  'vault/createPasswordEntry',
  async (
    data: {
      websiteName: string;
      websiteUrl?: string;
      username: string;
      password: string;
      notes?: string;
      folder?: string;
      favorite?: boolean;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const encryptionKey = state.auth.encryptionKey;

      if (!encryptionKey) {
        return rejectWithValue('Encryption key not available');
      }

      const encryptedData = await encryptEntryData(data, encryptionKey);

      const response = await api.post<{
        success: boolean;
        data: { entry: PasswordEntry };
      }>('/api/vault', encryptedData);

      const encryptedEntry = response.data.data.entry;
      const decryptedEntry = await decryptEntry(encryptedEntry, encryptionKey);

      return { encryptedEntry, decryptedEntry };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updatePasswordEntry = createAsyncThunk(
  'vault/updatePasswordEntry',
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: {
        websiteName?: string;
        websiteUrl?: string;
        username?: string;
        password?: string;
        notes?: string;
        folder?: string;
        favorite?: boolean;
      };
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const encryptionKey = state.auth.encryptionKey;

      if (!encryptionKey) {
        return rejectWithValue('Encryption key not available');
      }

      const encryptedData: UpdatePasswordEntryInput = {};

      if (data.username !== undefined) {
        encryptedData.encryptedUsername = await encryptField(data.username, encryptionKey);
      }
      if (data.password !== undefined) {
        encryptedData.encryptedPassword = await encryptField(data.password, encryptionKey);
      }
      if (data.notes !== undefined) {
        encryptedData.encryptedNotes = await encryptField(data.notes, encryptionKey);
      }
      if (data.websiteName !== undefined) encryptedData.websiteName = data.websiteName;
      if (data.websiteUrl !== undefined) encryptedData.websiteUrl = data.websiteUrl;
      if (data.folder !== undefined) encryptedData.folder = data.folder;
      if (data.favorite !== undefined) encryptedData.favorite = data.favorite;

      const response = await api.patch<{
        success: boolean;
        data: { entry: PasswordEntry };
      }>(`/api/vault/${id}`, encryptedData);

      const encryptedEntry = response.data.data.entry;
      const decryptedEntry = await decryptEntry(encryptedEntry, encryptionKey);

      return { encryptedEntry, decryptedEntry };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deletePasswordEntry = createAsyncThunk(
  'vault/deletePasswordEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/vault/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'vault/toggleFavorite',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const encryptionKey = state.auth.encryptionKey;

      if (!encryptionKey) {
        return rejectWithValue('Encryption key not available');
      }

      const response = await api.patch<{
        success: boolean;
        data: { entry: PasswordEntry };
      }>(`/api/vault/${id}/favorite`);

      const encryptedEntry = response.data.data.entry;
      const decryptedEntry = await decryptEntry(encryptedEntry, encryptionKey);

      return { encryptedEntry, decryptedEntry };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const vaultSlice = createSlice({
  name: 'vault',
  initialState,
  reducers: {
    openAddModal: (state) => {
      state.isAddModalOpen = true;
    },
    closeAddModal: (state) => {
      state.isAddModalOpen = false;
    },
    openEditModal: (state, action: PayloadAction<DecryptedPasswordEntry>) => {
      state.selectedEntry = action.payload;
      state.isEditModalOpen = true;
    },
    closeEditModal: (state) => {
      state.selectedEntry = null;
      state.isEditModalOpen = false;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilterFolder: (state, action: PayloadAction<string | null>) => {
      state.filterFolder = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch entries
    builder
      .addCase(fetchPasswordEntries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPasswordEntries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.encryptedEntries = action.payload.encryptedEntries;
        state.decryptedEntries = action.payload.decryptedEntries;
      })
      .addCase(fetchPasswordEntries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create entry
    builder
      .addCase(createPasswordEntry.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(createPasswordEntry.fulfilled, (state, action) => {
        state.isSaving = false;
        state.encryptedEntries.unshift(action.payload.encryptedEntry);
        state.decryptedEntries.unshift(action.payload.decryptedEntry);
        state.isAddModalOpen = false;
      })
      .addCase(createPasswordEntry.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // Update entry
    builder
      .addCase(updatePasswordEntry.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updatePasswordEntry.fulfilled, (state, action) => {
        state.isSaving = false;
        const index = state.encryptedEntries.findIndex(
          (e) => e.id === action.payload.encryptedEntry.id
        );
        if (index !== -1) {
          state.encryptedEntries[index] = action.payload.encryptedEntry;
          state.decryptedEntries[index] = action.payload.decryptedEntry;
        }
        state.isEditModalOpen = false;
        state.selectedEntry = null;
      })
      .addCase(updatePasswordEntry.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // Delete entry
    builder
      .addCase(deletePasswordEntry.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(deletePasswordEntry.fulfilled, (state, action) => {
        state.isSaving = false;
        state.encryptedEntries = state.encryptedEntries.filter((e) => e.id !== action.payload);
        state.decryptedEntries = state.decryptedEntries.filter((e) => e.id !== action.payload);
      })
      .addCase(deletePasswordEntry.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // Toggle favorite
    builder.addCase(toggleFavorite.fulfilled, (state, action) => {
      const index = state.encryptedEntries.findIndex(
        (e) => e.id === action.payload.encryptedEntry.id
      );
      if (index !== -1) {
        state.encryptedEntries[index] = action.payload.encryptedEntry;
        state.decryptedEntries[index] = action.payload.decryptedEntry;
      }
    });
  },
});

export const {
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  setSearchQuery,
  setFilterFolder,
  clearError,
} = vaultSlice.actions;

export default vaultSlice.reducer;