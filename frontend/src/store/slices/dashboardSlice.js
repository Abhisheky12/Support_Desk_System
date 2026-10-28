import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: {
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      waitingTickets: 0,
      resolvedTickets: 0,
      urgentTickets: 0,
      overdueTickets: 0,
      breakdown: {
        byPriority: { Low: 0, Medium: 0, High: 0, Urgent: 0 },
        byStatus: { Open: 0, 'In Progress': 0, 'Waiting on Customer': 0, Resolved: 0 }
      },
      agentWorkload: []
    },
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch dashboard statistics';
      });
  }
});

export default dashboardSlice.reducer;

