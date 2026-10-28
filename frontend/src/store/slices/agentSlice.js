import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAgents = createAsyncThunk(
  'agents/fetchAgents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/agents');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createAgent = createAsyncThunk(
  'agents/createAgent',
  async (agentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/agents', agentData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateAgent = createAsyncThunk(
  'agents/updateAgent',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/agents/${id}`, updates);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const agentSlice = createSlice({
  name: 'agents',
  initialState: {
    agents: [],
    loading: false,
    submitting: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Agents
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.agents = action.payload;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch agents';
      })
      // Create Agent
      .addCase(createAgent.pending, (state) => {
        state.submitting = true;
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.submitting = false;
        state.agents.unshift(action.payload);
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      // Update Agent
      .addCase(updateAgent.fulfilled, (state, action) => {
        const index = state.agents.findIndex((a) => a._id === action.payload._id);
        if (index !== -1) {
          state.agents[index] = { ...state.agents[index], ...action.payload };
        }
      });
  }
});

export default agentSlice.reducer;

