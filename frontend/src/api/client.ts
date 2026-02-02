import axios from 'axios';
import type { Session, StoryResponse, MusicInfo, GenerationStatus } from '../types';

const api = axios.create({
  baseURL: '', // Using relative path for proxy
});

export const sessionApi = {
  createSession: async () => {
    const response = await api.post<Session>('/sessions');
    return response.data;
  },

  submitStory: async (sessionId: string, story: string) => {
    const response = await api.post<Partial<StoryResponse>>(`/sessions/${sessionId}/story`, { story });
    return response.data;
  },

  lockLyrics: async (sessionId: string, data: { lyrics: string[]; language: string; hook_line: string }) => {
    const response = await api.post(`/sessions/${sessionId}/lyrics/lock`, data);
    return response.data;
  },

  generateStyles: async (sessionId: string) => {
    const response = await api.post<{ style_cards: any[] }>(`/sessions/${sessionId}/styles`);
    return response.data;
  },

  generateMusic: async (sessionId: string, _data: { scene_id: string; tweak_prompt: string }) => {
    // Note: Backend expects styles to be locked first, then music job created
    await api.post(`/sessions/${sessionId}/styles/lock`, { selected_style_card_id: _data.scene_id });
    const response = await api.post<{ job_id: string }>(`/sessions/${sessionId}/music`);
    return response.data;
  },

  getJobStatus: async (jobId: string) => {
    const response = await api.get<{ job: any, asset: any }>(`/jobs/${jobId}`);
    return response.data;
  },
};
