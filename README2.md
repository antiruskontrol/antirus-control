[🇺🇦 Українська](#Українська) | [🇬🇧 English](#English)

# UAFilter

## English 

A browser-extension content script that blurs Russian text on any website and automatically skips Russian-language YouTube Shorts.

## Features

- **Auto-skip in YouTube Shorts.** Detects Russian-language videos by title, channel name and description, then moves to the next Short (Next button, with an `ArrowDown` fallback). The audio is muted during the skip, a failed skip is retried, and a previously skipped video is skipped again if you scroll back to it.
- **Confirmation via video metadata.** A marker found in the page is double-checked against the video's title and description fetched from YouTube (same-origin request to `youtube.com`). This filters out UI texts and stale DOM content, so false skips are rare.
- **Text blur on all websites.** Russian text (comments, descriptions, titles, links and other page elements) is blurred on any site, not only on YouTube. The blur is removed automatically if the page reuses the element for clean text.
- **Language detection without external services.** Unicode-aware regex layers:
  - letters unique to Russian (`ы э ъ ё`);
  - typical endings and short particles;
  - a dictionary of Russian words;
  - grammar patterns.

  Weaker layers are disabled when the text contains Ukrainian letters (`і ї є ґ`), to avoid false positives on Ukrainian content.
- **SPA-safe.** Works with YouTube's reused player containers and tracks the current video ID.
- **Skip counter** in the corner of the page (`UAFilter: N`).
- **Safe zones.** Does nothing on AI chat sites (ChatGPT, Claude, Gemini, etc.).
- **Minimal console output.** The release build logs only the startup message and, on every skip, the video ID with the triggering marker (type, word, context).

## Notes

The detection is heuristic, so occasional misses or false positives are possible. The dictionary and patterns are easy to tune at the top of the script.

Author: Афтіпа Марко Оцтович

---

## Українська

Контент-скрипт для браузерного розширення, який розмиває російський текст на будь-яких сайтах і автоматично пропускає російськомовні YouTube Shorts.

## Можливості

- **Автоскіп у YouTube Shorts.** Визначає російськомовні відео за назвою, каналом та описом і перегортає на наступне (кнопка «Наступне», запасний варіант `ArrowDown`). Під час скіпу звук вимикається, невдалий скіп повторюється, а якщо ви повернулись на раніше скіпнуте відео, воно пропускається знову.
- **Підтвердження через метадані відео.** Маркер, знайдений на сторінці, додатково перевіряється за назвою й описом відео, які завантажуються з YouTube (запит на той самий `youtube.com`). Це відсіює службові тексти інтерфейсу та застарілий вміст DOM, тому хибні скіпи трапляються рідко.
- **Розмиття тексту на всіх сайтах.** Російський текст (коментарі, описи, заголовки, посилання та інші елементи сторінки) розмивається на будь-якому сайті, а не лише на YouTube. Якщо сторінка підставляє в той самий елемент чистий текст, розмиття знімається автоматично.
- **Визначення мови без зовнішніх сервісів.** Багаторівневі регулярні вирази з підтримкою Unicode:
  - літери, унікальні для російської (`ы э ъ ё`);
  - типові закінчення та короткі частки;
  - словник російських слів;
  - граматичні патерни.

  Слабші рівні вимикаються, якщо в тексті є українські літери (`і ї є ґ`), щоб не було хибних спрацювань на українському контенті.
- **Підтримка SPA.** Коректно працює з повторним використанням контейнерів плеєра YouTube та відстежує ID поточного відео.
- **Лічильник скіпів** у куті сторінки (`UAFilter: N`).
- **Безпечні зони.** Нічого не робить на сайтах AI-чатів (ChatGPT, Claude, Gemini тощо).
- **Мінімум у консолі.** Реліз-версія виводить лише стартове повідомлення та при кожному скіпі ID відео з маркером, що спрацював (тип, слово, контекст).

## Примітки

Визначення мови евристичне, тому можливі поодинокі пропуски або хибні спрацювання. Словник і патерни легко налаштувати на початку скрипта.

Автор: Афтіпа Марко Оцтович
