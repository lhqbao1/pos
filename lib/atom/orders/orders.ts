import { atom } from "jotai";

export const statusFilterAtom = atom<string>("all");
export const startDateFilterAtom = atom<string>();
export const endDateFilterAtom = atom<string>(new Date().toISOString());