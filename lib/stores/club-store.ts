import { create } from 'zustand';

interface Club {
  id: string; // group id
  title: string;
  created_at: string;
  owner?: {
    id: string;
    name: string;
    image?: string;
  };
}

interface ClubStore {
  userClubs: Club[];
  isLoading: boolean;
  error: string | null;
  setUserClubs: (clubs: Club[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getUserClubById: (clubId: string) => Club | undefined;
}

export const useClubStore = create<ClubStore>((set, get) => ({
  userClubs: [],
  isLoading: false,
  error: null,
  
  setUserClubs: (clubs) => set({ userClubs: clubs }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  getUserClubById: (clubId) => {
    const { userClubs } = get();
    return userClubs.find(club => club.id === clubId);
  },
})); 