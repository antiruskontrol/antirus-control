# 🛡️ UAFilter (Antirus-Control)

[🇺🇦 Українська](#-українська) | [🇬🇧 English](#-english)

---

## 🇺🇦 Українська

**UAFilter** — це контент-скрипт для браузерного розширення, який забезпечує інформаційну гігієну, розмиваючи російський текст на будь-яких вебсайтах та автоматично пропускаючи російськомовні YouTube Shorts. Проєкт є повністю соціальним, відкритим (Open-Source) та орієнтованим на приватність — **нульовий збір персональних даних**.

### 🚀 Можливості

* **Автоскіп у YouTube Shorts:** Автоматично визначає російськомовні відео за назвою, назвою каналу та описом, після чого перегортає на наступне відео (через кнопку «Наступне» або запасний варіант `ArrowDown`). Під час перегортання звук тимчасово вимикається, а невдалий скіп автоматично повторюється.
* **Підтвердження через метадані:** Знайдені маркери додатково перевіряються через прямий запит до метаданих відео на `youtube.com`. Це мінімізує хибні спрацювання на інтерфейс сайту.
* **Розмиття тексту на всіх сайтах:** Російські коментарі, описи, посилання та заголовки розмиваються на будь-якому відкритому сайті. Якщо контент динамічно змінюється на чистий текст, розмиття автоматично знімається.
* **Локальне визначення мови (Без серверів):** Використовує багаторівневі регулярні вирази (Unicode):
  - Літери, унікальні для російської мови (`ы`, `э`, `ъ`, `ё`);
  - Типові закінчення та короткі частки;
  - Вбудований словник російських слів та граматичні патерни.
  *Примітка: Перевірка вимикається, якщо текст містить українські літери (`і`, `ї`, `є`, `ґ`), для захисту від хибних спрацювань.*
* **Підтримка SPA:** Стабільно працює в сучасних вебдодатках та коректно відстежує ID плеєра YouTube без перезавантаження сторінки.
* **Лічильник скіпів:** Візуальний індикатор `UAFilter: N` у кутку сторінки показує кількість пропущених відео.
* **Безпечні зони:** Скрипт автоматично ігнорує AI-чати (ChatGPT, Claude, Gemini тощо).

### 🛠️ Інструкція зі встановлення
Детальну інструкцію з ручного встановлення розширення в браузер ви знайдете у файлі **[install-guide(en+ua).md](./install-guide(en+ua).md)**.

### 📬 Зворотний зв'язок
Якщо ви знайшли помилку, хочете запропонувати нові правила блокування або покращити словник:
* **Автор:** Афтіпа Марко Оцтович
* **Email:** [antiruskontrol@ukr.net](mailto:antiruskontrol@ukr.net)

---

## 🇬🇧 English

**UAFilter** is a browser-extension content script designed for digital hygiene. It blurs Russian text across all websites and automatically skips Russian-language YouTube Shorts. This is a social open-source project focused on complete privacy — **zero data collection**.

### 🚀 Features

* **Auto-skip in YouTube Shorts:** Detects Russian-language videos by title, channel name, and description, then moves to the next Short. Mutes audio during the skip and retries automatically if a skip fails.
* **Verification via Metadata:** Double-checks page markers against the video's title and description fetched directly from `youtube.com` to eliminate false positives from the UI.
* **Text Blur on All Websites:** Blurs Russian comments, descriptions, links, and titles on any site. Automatically removes the blur if the element's content updates to clean text.
* **Offline Language Detection:** Powered by Unicode-aware regex layers:
  - Letters unique to Russian (`ы`, `э`, `ъ`, `ё`);
  - Common endings and short particles;
  - Built-in Russian word dictionary and grammar patterns.
  *Note: Detection layers are automatically disabled if Ukrainian letters (`і`, `ї`, `є`, `ґ`) are present.*
* **SPA-Safe:** Seamlessly tracks YouTube's video container reuses and handles dynamic page changes.
* **Skip Counter:** Displays an onscreen counter (`UAFilter: N`) in the corner of the page.
* **Safe Zones:** Automatically stays inactive on AI chat services (ChatGPT, Claude, Gemini, etc.).

### 📬 Contact & Feedback
* **Author:** Aftipa Marko Otsvych
* **Email:** [antiruskontrol@ukr.net](mailto:antiruskontrol@ukr.net)
