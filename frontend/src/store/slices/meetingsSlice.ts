import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Meeting, CreateMeetingDto } from '../../types';
import { meetingsApi } from '../../services/api';

interface MeetingsState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  loading: boolean;
  error: string | null;
  total: number;
  dashboardStats: any;
}

const initialState: MeetingsState = {
  meetings: [],
  currentMeeting: null,
  loading: false,
  error: null,
  total: 0,
  dashboardStats: null,
};

export const fetchMeetings = createAsyncThunk('meetings/fetchAll', async (params: any, { rejectWithValue }) => {
  try {
    const res = await meetingsApi.getAll(params);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch meetings');
  }
});

export const fetchMeetingById = createAsyncThunk('meetings/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    const res = await meetingsApi.getById(id);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch meeting');
  }
});

export const createMeeting = createAsyncThunk('meetings/create', async (data: CreateMeetingDto, { rejectWithValue }) => {
  try {
    const res = await meetingsApi.create(data);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create meeting');
  }
});

export const updateMeeting = createAsyncThunk('meetings/update', async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
  try {
    const res = await meetingsApi.update(id, data);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update meeting');
  }
});

export const cancelMeeting = createAsyncThunk('meetings/cancel', async ({ id, reason }: { id: string; reason?: string }, { rejectWithValue }) => {
  try {
    await meetingsApi.cancel(id, reason);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to cancel meeting');
  }
});

export const fetchDashboard = createAsyncThunk('meetings/dashboard', async (_, { rejectWithValue }) => {
  try {
    const res = await meetingsApi.getDashboard();
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch dashboard');
  }
});

const meetingsSlice = createSlice({
  name: 'meetings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeetings.pending, (state) => { state.loading = true; })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.loading = false;
        state.meetings = action.payload.data;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMeetingById.fulfilled, (state, action) => {
        state.currentMeeting = action.payload;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        state.meetings.unshift(action.payload);
      })
      .addCase(updateMeeting.fulfilled, (state, action) => {
        const idx = state.meetings.findIndex((m) => m._id === action.payload._id);
        if (idx !== -1) state.meetings[idx] = action.payload;
        if (state.currentMeeting?._id === action.payload._id) state.currentMeeting = action.payload;
      })
      .addCase(cancelMeeting.fulfilled, (state, action) => {
        const idx = state.meetings.findIndex((m) => m._id === action.payload);
        if (idx !== -1) state.meetings[idx].status = 'cancelled';
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
      });
  },
});

export default meetingsSlice.reducer;
