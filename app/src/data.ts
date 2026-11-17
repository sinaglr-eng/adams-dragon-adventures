import vocabularyData from "../..//content/vocabulary.json";
import questData from "../../content/quests.json";
import achievementData from "../../content/achievements.json";
export const vocabulary = vocabularyData.vocabulary;
export const quests = questData.quests;
export const achievements = achievementData.achievements;
export type Word = (typeof vocabulary)[number];
export type Quest = (typeof quests)[number];
export type Conditions = (typeof achievements)[number]["conditions"];
export type Lang = "cs" | "en";
export const words = Object.fromEntries(vocabulary.map((w) => [w.id, w]));
export const questById = Object.fromEntries(quests.map((q) => [q.id, q]));
export const locale = (lang: Lang) => (lang === "cs" ? "cs-CZ" : "en-US");
export const asset = (id: string) =>
  `${import.meta.env.BASE_URL}game-assets/art/${id.replace("/", "-")}.webp`;
export const englishTitles = [
  "Home in Iowa",
  "The secret of the lake",
  "Klárka’s tiny neighbors",
  "Off to Příbram!",
  "Grandpa’s bike workshop",
  "Romča’s mystery catch",
  "The big fish adventure",
  "Tell Grandma a story",
];
export const title = (q: Quest, lang: Lang) =>
  lang === "cs" ? q.title : englishTitles[quests.indexOf(q)];
