import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/tickets', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchTicketById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tickets/${id}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      const response = await api.post('/tickets', ticketData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateTicket = createAsyncThunk(
  'tickets/updateTicket',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/tickets/${id}`, updates);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const assignTicket = createAsyncThunk(
  'tickets/assignTicket',
  async ({ id, agentId }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/tickets/${id}/assign`, { agentId });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'tickets/fetchMessages',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tickets/${ticketId}/messages`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addMessage = createAsyncThunk(
  'tickets/addMessage',
  async ({ ticketId, content, type }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/tickets/${ticketId}/messages`, { content, type });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchActivity = createAsyncThunk(
  'tickets/fetchActivity',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tickets/${ticketId}/activity`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const ticketSlice = createSlice({
  name: 'tickets',
  initialState: {
    tickets: [],
    currentTicket: null,
    messages: [],
    activity: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1
    },
    filters: {
      search: '',
      status: 'all',
      priority: 'all',
      assignedTo: 'all',
      sortBy: 'updatedAt_desc',
      page: 1,
      limit: 10
    },
    loading: false,
    detailLoading: false,
    messageSending: false,
    error: null
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        search: '',
        status: 'all',
        priority: 'all',
        assignedTo: 'all',
        sortBy: 'updatedAt_desc',
        page: 1,
        limit: 10
      };
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
      state.messages = [];
      state.activity = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tickets
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch tickets';
      })
      // Fetch Ticket Details
      .addCase(fetchTicketById.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentTicket = action.payload;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      // Update Ticket
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.currentTicket = action.payload;
        // Also update in list if present
        const index = state.tickets.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      // Assign Ticket
      .addCase(assignTicket.fulfilled, (state, action) => {
        state.currentTicket = action.payload;
        const index = state.tickets.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      // Fetch Messages
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages = action.payload;
      })
      // Add Message
      .addCase(addMessage.pending, (state) => {
        state.messageSending = true;
      })
      .addCase(addMessage.fulfilled, (state, action) => {
        state.messageSending = false;
        state.messages.push(action.payload);
      })
      .addCase(addMessage.rejected, (state) => {
        state.messageSending = false;
      })
      // Fetch Activity
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.activity = action.payload;
      });
  }
});

export const { setFilters, resetFilters, clearCurrentTicket } = ticketSlice.actions;
export default ticketSlice.reducer;

