/**
 * CreatePostContext
 *
 * Shared draft state for the create-post flow.
 * Sub-screens (location, tag-people, music, feeling) write into this context
 * directly before calling router.back(), so the parent screen always sees
 * the latest values — no router.setParams() required.
 */
import React, { createContext, useContext, useState } from 'react';

export interface CreatePostDraft {
  feeling: { label: string; icon: string } | null;
  location: string | null;
  taggedIds: string[];
  song: { title: string; artist: string } | null;
}

interface CreatePostContextType extends CreatePostDraft {
  setFeeling: (f: CreatePostDraft['feeling']) => void;
  setLocation: (l: string | null) => void;
  setTaggedIds: (ids: string[]) => void;
  setSong: (s: CreatePostDraft['song']) => void;
  reset: () => void;
}

const defaultDraft: CreatePostDraft = {
  feeling: null,
  location: null,
  taggedIds: [],
  song: null,
};

const CreatePostContext = createContext<CreatePostContextType>({
  ...defaultDraft,
  setFeeling: () => {},
  setLocation: () => {},
  setTaggedIds: () => {},
  setSong: () => {},
  reset: () => {},
});

export function CreatePostProvider({ children }: { children: React.ReactNode }) {
  const [feeling, setFeeling] = useState<CreatePostDraft['feeling']>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [taggedIds, setTaggedIds] = useState<string[]>([]);
  const [song, setSong] = useState<CreatePostDraft['song']>(null);

  const reset = () => {
    setFeeling(null);
    setLocation(null);
    setTaggedIds([]);
    setSong(null);
  };

  return (
    <CreatePostContext.Provider value={{ feeling, setFeeling, location, setLocation, taggedIds, setTaggedIds, song, setSong, reset }}>
      {children}
    </CreatePostContext.Provider>
  );
}

export const useCreatePost = () => useContext(CreatePostContext);
