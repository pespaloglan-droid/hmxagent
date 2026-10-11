import { create } from "zustand";
import { persist } from "zustand/middleware";

/** UI state: aktif sayfa, command palette, wizard. Page secimi persist edilir. */
interface UiStore {
  page: string;
  paletteOpen: boolean;
  wizardOpen: boolean;
  setPage: (page: string) => void;
  setPaletteOpen: (open: boolean) => void;
  setWizardOpen: (open: boolean) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      page: "chat",
      paletteOpen: false,
      wizardOpen: false,
      setPage: (page) => set({ page }),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      setWizardOpen: (wizardOpen) => set({ wizardOpen }),
    }),
    {
      name: "hmx-agent-ui",
      version: 1,
      partialize: (s) => ({ page: s.page, wizardOpen: s.wizardOpen }),
    },
  ),
);
