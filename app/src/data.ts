import vocabularyData from "../..//content/vocabulary.json";
import { allQuests } from "./quest-content";
export { activeQuests } from "./quest-content";
export type { Quest } from "./quest-content";
import type { Quest } from "./quest-content";
import achievementData from "../../content/achievements.json";
export const vocabulary = vocabularyData.vocabulary;
export const quests = allQuests;
export const achievements = achievementData.achievements;
export type Word = (typeof vocabulary)[number];
export type Conditions = (typeof achievements)[number]["conditions"];
export type Lang = "cs" | "en";
export const words = Object.fromEntries(vocabulary.map((w) => [w.id, w]));
export const questById = Object.fromEntries(quests.map((q) => [q.id, q]));
export const locale = (lang: Lang) => (lang === "cs" ? "cs-CZ" : "en-US");
export const asset = (id: string) =>
  `${import.meta.env.BASE_URL}game-assets/art/${id.replace("/", "-")}.webp`;
export const title = (q: Quest, lang: Lang) =>
  lang === "cs" ? q.title : q.titleEn;
