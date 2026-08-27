const COMMON_WORDS: string[] = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see",
  "other", "than", "then", "now", "look", "only", "come", "its", "over",
  "think", "also", "back", "after", "use", "two", "how", "our", "work",
  "first", "well", "way", "even", "new", "want", "because", "any", "these",
  "give", "day", "most", "find", "here", "thing", "many", "tell", "help",
  "hand", "high", "keep", "last", "long", "great", "little", "own", "old",
  "right", "big", "large", "next", "small", "still", "children", "should",
  "never", "place", "between", "under", "again", "home", "read",
  "very", "much", "where", "before", "must", "too", "same", "each",
  "sure", "body", "while", "always", "music", "world", "through",
  "need", "move", "live", "real", "left", "night", "life", "kind", "close",
  "more", "point", "family", "follow", "study", "learn",
  "country", "found", "answer", "school", "grow", "tree", "cross",
  "farm", "hard", "start", "might", "story", "far", "sea", "draw",
  "late", "press", "close", "night", "real", "life", "few", "north",
  "open", "seem", "together", "next", "white", "children", "begin", "got",
  "walk", "example", "ease", "paper", "group", "always", "music", "those",
  "both", "mark", "book", "letter", "until", "mile", "river", "car", "feet",
  "care", "second", "enough", "plain", "girl", "usual", "young", "ready",
  "above", "ever", "red", "list", "though", "feel", "talk", "bird", "soon",
  "body", "dog", "family", "direct", "pose", "leave", "song", "measure",
  "door", "product", "black", "short", "numeral", "class", "wind", "question",
  "happen", "complete", "ship", "area", "half", "rock", "order", "fire",
  "south", "problem", "piece", "told", "knew", "pass", "since", "top",
  "whole", "king", "space", "heard", "best", "hour", "better", "true",
  "during", "hundred", "five", "remember", "step", "early", "hold", "west",
  "ground", "interest", "reach", "fast", "verb", "sing", "listen", "six",
  "table", "travel", "less", "morning", "ten", "simple", "several", "vowel",
  "toward", "war", "lay", "against", "pattern", "slow", "center", "love",
  "person", "money", "serve", "appear", "road", "map", "rain", "rule",
  "govern", "pull", "cold", "notice", "voice", "energy", "hunt", "probable",
  "bed", "brother", "egg", "ride", "cell", "believe", "perhaps", "pick",
  "sudden", "count", "square", "reason", "length", "represent", "mouth",
  "sign", "record", "ship", "area", "half", "rock", "order",
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

export function getRandomWords(count: number): string[] {
  const shuffled = shuffleArray(COMMON_WORDS);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getTargetText(wordCount: number): string {
  return getRandomWords(wordCount).join(" ");
}

let extraWordsPool: string[] = [];

export function getExtraWords(count: number): string {
  if (extraWordsPool.length < count) {
    extraWordsPool = shuffleArray(COMMON_WORDS);
  }
  const words = extraWordsPool.splice(0, count);
  return words.join(" ");
}
