export interface Session {
  session_id: string;
}

export interface StoryResponse {
  summary: string;
  lyrics_a: {
    label: string;
    tags: string[];
    content: string[];
    critic: string;
  };
  lyrics_b: {
    label: string;
    tags: string[];
    content: string[];
    critic: string;
  };
  agent_question: {
    dimension: string;
    text: string;
    options: {
      id: string;
      label: string;
      icon: string;
    }[];
  };
  hooks: string[];
}

export interface MusicInfo {
  music_id: string;
  title: string;
  audio_url: string;
  cover_url?: string;
  style_tags: string[];
}

export interface GenerationStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  music_info?: MusicInfo;
}

export interface SceneCard {
  id: string;
  title: string;
  desc: string;
  audio_tags: string;
  visual_icon: React.ReactNode;
  color: string;
}
