// Bible 66 卷结构数据
// 每卷: { id, name, chapters, testament }
// testament: O=旧约, N=新约
const BIBLE_BOOKS = [
  // 旧约 39 卷
  { id: "gen",   name: "创世记",   en: "Genesis",     chapters: 50, t: "O" },
  { id: "exo",   name: "出埃及记", en: "Exodus",      chapters: 40, t: "O" },
  { id: "lev",   name: "利未记",   en: "Leviticus",   chapters: 27, t: "O" },
  { id: "num",   name: "民数记",   en: "Numbers",     chapters: 36, t: "O" },
  { id: "deu",   name: "申命记",   en: "Deuteronomy", chapters: 34, t: "O" },
  { id: "jos",   name: "约书亚记", en: "Joshua",      chapters: 24, t: "O" },
  { id: "jdg",   name: "士师记",   en: "Judges",      chapters: 21, t: "O" },
  { id: "rut",   name: "路得记",   en: "Ruth",        chapters: 4,  t: "O" },
  { id: "1sa",   name: "撒母耳记上", en: "1 Samuel",  chapters: 31, t: "O" },
  { id: "2sa",   name: "撒母耳记下", en: "2 Samuel",  chapters: 24, t: "O" },
  { id: "1ki",   name: "列王纪上", en: "1 Kings",     chapters: 22, t: "O" },
  { id: "2ki",   name: "列王纪下", en: "2 Kings",     chapters: 25, t: "O" },
  { id: "1ch",   name: "历代志上", en: "1 Chronicles", chapters: 29, t: "O" },
  { id: "2ch",   name: "历代志下", en: "2 Chronicles", chapters: 36, t: "O" },
  { id: "ezr",   name: "以斯拉记", en: "Ezra",        chapters: 10, t: "O" },
  { id: "neh",   name: "尼希米记", en: "Nehemiah",    chapters: 13, t: "O" },
  { id: "est",   name: "以斯帖记", en: "Esther",      chapters: 10, t: "O" },
  { id: "job",   name: "约伯记",   en: "Job",         chapters: 42, t: "O" },
  { id: "psa",   name: "诗篇",     en: "Psalms",      chapters: 150, t: "O" },
  { id: "pro",   name: "箴言",     en: "Proverbs",    chapters: 31, t: "O" },
  { id: "ecc",   name: "传道书",   en: "Ecclesiastes", chapters: 12, t: "O" },
  { id: "sng",   name: "雅歌",     en: "Song of Songs", chapters: 8, t: "O" },
  { id: "isa",   name: "以赛亚书", en: "Isaiah",      chapters: 66, t: "O" },
  { id: "jer",   name: "耶利米书", en: "Jeremiah",    chapters: 52, t: "O" },
  { id: "lam",   name: "耶利米哀歌", en: "Lamentations", chapters: 5, t: "O" },
  { id: "ezk",   name: "以西结书", en: "Ezekiel",     chapters: 48, t: "O" },
  { id: "dan",   name: "但以理书", en: "Daniel",      chapters: 12, t: "O" },
  { id: "hos",   name: "何西阿书", en: "Hosea",       chapters: 14, t: "O" },
  { id: "jol",   name: "约珥书",   en: "Joel",        chapters: 3,  t: "O" },
  { id: "amo",   name: "阿摩司书", en: "Amos",        chapters: 9,  t: "O" },
  { id: "oba",   name: "俄巴底亚书", en: "Obadiah",   chapters: 1,  t: "O" },
  { id: "jon",   name: "约拿书",   en: "Jonah",       chapters: 4,  t: "O" },
  { id: "mic",   name: "弥迦书",   en: "Micah",       chapters: 7,  t: "O" },
  { id: "nam",   name: "那鸿书",   en: "Nahum",       chapters: 3,  t: "O" },
  { id: "hab",   name: "哈巴谷书", en: "Habakkuk",    chapters: 3,  t: "O" },
  { id: "zep",   name: "西番雅书", en: "Zephaniah",   chapters: 3,  t: "O" },
  { id: "hag",   name: "哈该书",   en: "Haggai",      chapters: 2,  t: "O" },
  { id: "zec",   name: "撒迦利亚书", en: "Zechariah", chapters: 14, t: "O" },
  { id: "mal",   name: "玛拉基书", en: "Malachi",     chapters: 4,  t: "O" },

  // 新约 27 卷
  { id: "mat",   name: "马太福音", en: "Matthew",     chapters: 28, t: "N" },
  { id: "mrk",   name: "马可福音", en: "Mark",        chapters: 16, t: "N" },
  { id: "luk",   name: "路加福音", en: "Luke",        chapters: 24, t: "N" },
  { id: "jhn",   name: "约翰福音", en: "John",        chapters: 21, t: "N" },
  { id: "act",   name: "使徒行传", en: "Acts",        chapters: 28, t: "N" },
  { id: "rom",   name: "罗马书",   en: "Romans",      chapters: 16, t: "N" },
  { id: "1co",   name: "哥林多前书", en: "1 Corinthians", chapters: 16, t: "N" },
  { id: "2co",   name: "哥林多后书", en: "2 Corinthians", chapters: 13, t: "N" },
  { id: "gal",   name: "加拉太书", en: "Galatians",   chapters: 6,  t: "N" },
  { id: "eph",   name: "以弗所书", en: "Ephesians",   chapters: 6,  t: "N" },
  { id: "php",   name: "腓立比书", en: "Philippians", chapters: 4,  t: "N" },
  { id: "col",   name: "歌罗西书", en: "Colossians",  chapters: 4,  t: "N" },
  { id: "1th",   name: "帖撒罗尼迦前书", en: "1 Thessalonians", chapters: 5, t: "N" },
  { id: "2th",   name: "帖撒罗尼迦后书", en: "2 Thessalonians", chapters: 3, t: "N" },
  { id: "1ti",   name: "提摩太前书", en: "1 Timothy", chapters: 6,  t: "N" },
  { id: "2ti",   name: "提摩太后书", en: "2 Timothy", chapters: 4,  t: "N" },
  { id: "tit",   name: "提多书",   en: "Titus",       chapters: 3,  t: "N" },
  { id: "phm",   name: "腓利门书", en: "Philemon",    chapters: 1,  t: "N" },
  { id: "heb",   name: "希伯来书", en: "Hebrews",     chapters: 13, t: "N" },
  { id: "jas",   name: "雅各书",   en: "James",       chapters: 5,  t: "N" },
  { id: "1pe",   name: "彼得前书", en: "1 Peter",     chapters: 5,  t: "N" },
  { id: "2pe",   name: "彼得后书", en: "2 Peter",     chapters: 3,  t: "N" },
  { id: "1jn",   name: "约翰一书", en: "1 John",      chapters: 5,  t: "N" },
  { id: "2jn",   name: "约翰二书", en: "2 John",      chapters: 1,  t: "N" },
  { id: "3jn",   name: "约翰三书", en: "3 John",      chapters: 1,  t: "N" },
  { id: "jud",   name: "犹大书",   en: "Jude",        chapters: 1,  t: "N" },
  { id: "rev",   name: "启示录",   en: "Revelation",  chapters: 22, t: "N" },
];

// 计算总量
BIBLE_BOOKS.totalChapters = BIBLE_BOOKS.reduce((s, b) => s + b.chapters, 0); // 1189

// 卷号索引
BIBLE_BOOKS.byId = {};
BIBLE_BOOKS.forEach((b, i) => { b.index = i; BIBLE_BOOKS.byId[b.id] = b; });

// 从全局章序号 -> {book, chapter}
// idx0: 0-based 全局章号
function chapterFromGlobal(idx0) {
  let acc = 0;
  for (let i = 0; i < BIBLE_BOOKS.length; i++) {
    const b = BIBLE_BOOKS[i];
    if (idx0 < acc + b.chapters) {
      return { book: b, chapter: idx0 - acc + 1 };
    }
    acc += b.chapters;
  }
  return null;
}

// 从 卷+章 -> 全局 0-based 章号
function globalFromBookChapter(bookId, chapter) {
  const b = BIBLE_BOOKS.byId[bookId];
  if (!b) return -1;
  let acc = 0;
  for (let i = 0; i < b.index; i++) acc += BIBLE_BOOKS[i].chapters;
  return acc + (chapter - 1);
}

if (typeof module !== "undefined") module.exports = { BIBLE_BOOKS, chapterFromGlobal, globalFromBookChapter };
