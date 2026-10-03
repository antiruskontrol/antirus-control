// content.js — БАЗА 6.7 РЕЛІЗ (Unicode-межі слів, стейт Shorts без DOM-прапорців, зв'язок сканера зі скіпером)
// 6.1: опис відео береться з мережі (shortDescription) без відкриття вікна; передача маркера в скіпер — за "чорним списком" (коментарі), а не за білим
// 6.2: у кожному скіпі (і при поверненні на скіпнуте відео) друкується маркер: тип, слово, контекст; у логах "чисте" друкується перевірений текст
// 6.3: DOM-маркер у Shorts підтверджується описом з мережі (відсікає службовий/застарілий текст); з словника прибрано доставк*/оплат* (є в українській); менше шуму в логах
// 6.4: у логах чистих відео тільки ID і причина перевірки (без тексту)
// 6.5: ФІКС ukr.net — блюр більше не накриває завеликий контейнер (article#feed = уся стрічка новин): якщо найближчий контейнер довший за МАКС_ТЕКСТ_КОНТЕЙНЕРА, блюриться лише сам елемент з маркером;
//      словник очищено від склейок без "|" (синагог*этого, русск*опроверг*) і дублікатів; додано прапор DEBUG і дебаг-принт блюру (маркер, елемент, контейнер)
// РЕЛІЗ: більшість дебаг-принтів закоментовано; лишено стартовий напис, одне повідомлення при скіпі (ID + маркер) і (при DEBUG = true) рядок про кожен блюр
// 03.10.2026 13:50
// Розробник: Афтіпа Марко Оцтович
// antiruskontrol@ukr.net
(function ініціалізуватиДвигунОчищення() {
    const LOG = '[UAFilter-YouTube]';
    const DEBUG = true; // true — друкувати в консоль опис кожного блюру (маркер + елемент + контейнер); на чистому релізі поставити false
    const log = (...args) => console.log(LOG, ...args);
    const logStyled = (текст, стиль) => console.log('%c' + LOG + ' ' + текст, стиль);

    // Захист робочих чатів від випадкового замилювання
    const хост = window.location.hostname;
    const захищеніХости = new Array('chatgpt.com', 'openai.com', 'gemini.google.com', 'aistudio.google.com', 'claude.ai');
    if (захищеніХости.some((д) => хост === д || хост.endsWith('.' + д))) {
        // console.log('🟢 [Антірус] Наш діалог захищено від замилювання.');
        return;
    }

    console.log(LOG + ' 🚀 Скрипт запущено (база 6.5 реліз)');

    // ==================== ДЕТЕКТОР МОВИ ====================
    // ВАЖЛИВО: у JS класичні \b і \w НЕ працюють з кирилицею (\b ніколи не стоїть між кириличними літерами).
    // Тому всі межі слів зроблено через Unicode: (?<!літера) і (?!літера) з прапором u.
    const ЛІТЕРИ = '\\p{L}\\p{N}_';
    const МЕЖА_ЛІВА = '(?<![' + ЛІТЕРИ + '])';
    const МЕЖА_ПРАВА = '(?![' + ЛІТЕРИ + '])';
    const словаЯк = (шаблон, прапори) =>
        new RegExp(МЕЖА_ЛІВА + '(?:' + шаблон + ')' + МЕЖА_ПРАВА, прапори || 'iu');

    // Українські унікальні літери: якщо вони є в тексті, "слабкі" патерни (рівні 2-6) не застосовуються.
    // Це захищає від хибних спрацювань на українських текстах без жодної ізоляції від інтерфейсу.
    const українськіЛітери = /[іїєґІЇЄҐ]/;

    // === РІВЕНЬ 1 (сильний): літери, яких немає в українській ===
    const ворожийКонтентRegex = /[ыэъёЫЭЪЁ]|ьі|ЬІ|ьІ|Ьі/;

    // === РІВЕНЬ 2: російські закінчення (прибрано ит/ет/ов — вони збігаються з українськими словами: кабінет, букет, любов) ===
    const закінченняRegex = словаЯк('\\p{L}+(?:яя|ая|ые|ых|кой|вой|ной|ее|ого)');


    // === РІВЕНЬ 3: короткі частки/займенники (прибрано он/да/же/уже/об — вони існують в українській) ===
    const короткіЧасткиRegex = словаЯк(
        'из|от|оно|она|они|как|это|что|был|была|было|были|мне|меня|тебя|его|ему|ее|её|их|им|нет|со|во|ко|обо|надо'
    );

    // === РІВЕНЬ 4: словниковий маркер (прибрано слова, що є в українській: для, два, три, над, город, прямо, через, товар, масло, мука) ===
    // 6.5: словник зведено в один чистий список (без дублікатів і без склейок без "|")
    const бібліотекаВорожихСлів = словаЯк(
        'январ\\p{L}*|феврал\\p{L}*|март\\p{L}*|апрел\\p{L}*|ма(?:й|е|я|ев|и)|июн\\p{L}*|июл\\p{L}*|август\\p{L}*|сентябр\\p{L}*|октябр\\p{L}*|ноябр\\p{L}*|декабр\\p{L}*|' +
        'быстро|вкусно|сахар|[сС]пасибо|очень|только|еще|ещё|нет|него|нее|ней|всех|всем|под|даже|благодарю|' +
        'когда|если|хочу|могу|интересн\\p{L}*|ноч\\p{L}*|утро\\p{L}*|нету|сегодня|после|чтобы|ными|хотя|зачем|почему|сейчас|быть|больше|никакого|теста|почта|' +
        'платная|ввел|против|како\\p{L}*|следующ\\p{L}*|врем\\p{L}*|жизн\\p{L}*|год\\p{L}*|сказа\\p{L}*|буд\\p{L}*|росси\\p{L}*|' +
        'этого|этой|этом|этому|эти|этих|котор\\p{L}*|техни\\p{L}*|возможност\\p{L}*|руб\\p{L}*|выслан\\p{L}*|журналист\\p{L}*|русск\\p{L}*|' +
        'опроверг\\p{L}*|сообщени\\p{L}*|утрат\\p{L}*|отступлен\\p{L}*|моще\\p{L}*|геро\\p{L}*|спасш\\p{L}*|пассажир\\p{L}*|израильск\\p{L}*|рейс\\p{L}*|евре\\p{L}*|отвеча\\p{L}*|действ\\p{L}*|' +
        'пилот\\p{L}*|сантехник\\p{L}*|стоматолог\\p{L}*|синагог\\p{L}*'
    );

    // === Додаткові граматичні патерни ===
    // "с" лише малою літерою (інакше "Вітамін С та ..." давало б хибний збіг)
    const прийменникСRegex = new RegExp(МЕЖА_ЛІВА + 'с\\s+\\p{L}+', 'u');
    // Лише "-тся" (українське "-ться" існує: "вчиться", "сміється")
    const дієслівнеЗакінченняRegex = new RegExp('\\p{L}тся' + МЕЖА_ПРАВА, 'iu');

    const усіПатерни = new Array(
        { тип: 'унікальні літери (ы/э/ъ/ё/ьі)', regex: ворожийКонтентRegex, сильний: true },
        { тип: 'закінчення слова', regex: закінченняRegex, сильний: false },
        { тип: 'коротка частка/займенник', regex: короткіЧасткиRegex, сильний: false },
        { тип: 'словниковий маркер', regex: бібліотекаВорожихСлів, сильний: false },
        { тип: 'прийменник "с" + слово', regex: прийменникСRegex, сильний: false },
        { тип: 'дієслівне закінчення -тся', regex: дієслівнеЗакінченняRegex, сильний: false }
    );

    function знайтиМаркерВорожостi(текст) {
        const очищенийТекст = (текст || '').trim();
        if (!очищенийТекст) return null;

        const маєУкраїнськіЛітери = українськіЛітери.test(очищенийТекст);

        for (const { тип, regex, сильний } of усіПатерни) {
            if (!сильний && маєУкраїнськіЛітери) continue;
            const match = regex.exec(очищенийТекст);
            if (match) {
                const від = Math.max(0, match.index - 25);
                return {
                    тип,
                    збіг: match[0],
                    фрагмент: очищенийТекст.substring(від, match.index + match[0].length + 25),
                };
            }
        }
        return null;
    }

    // ==================== ЛІЧИЛЬНИК СКІПІВ ====================
    let кількістьСкіпів = 0;
    let лічильникElement = null;

    function створитиЛічильникЯкщоТреба() {
        if (лічильникElement && document.body && document.body.contains(лічильникElement)) return;
        лічильникElement = document.createElement('div');
        лічильникElement.id = 'ua-filter-counter';
        лічильникElement.style.cssText = new Array(
            'position: fixed',
            'bottom: 8px',
            'right: 8px',
            'z-index: 999999',
            'background: rgba(0,0,0,0.35)',
            'color: rgba(255,255,255,0.75)',
            'font-size: 11px',
            'font-family: sans-serif',
            'padding: 2px 6px',
            'border-radius: 4px',
            'pointer-events: none',
            'user-select: none'
        ).join(';');
        лічильникElement.textContent = 'UAFilter: ' + кількістьСкіпів;
        (document.body || document.documentElement).appendChild(лічильникElement);
    }

    function збільшитиЛічильникСкіпів() {
        кількістьСкіпів++;
        створитиЛічильникЯкщоТреба();
        if (лічильникElement) {
            лічильникElement.textContent = 'UAFilter: ' + кількістьСкіпів;
        }
    }

    // ==================== БЛОК SHORTS ====================
    // Стан тримаємо в JS-змінних, а НЕ в атрибутах контейнера: YouTube перевикористовує
    // <ytd-reel-video-renderer> для різних відео, тому DOM-прапорці "засинали" на нових відео.
    const рішення = new Map();          // id відео -> { вердикт: 'skip' | 'clean', підпис: текст }
    const спробиСкіпу = new Map();      // id відео -> { n, t }
    const заглушеніВідео = new Set();   // відео, які заглушили саме ми
    let текстОстаннього = '';           // текст останнього скіпнутого відео (для відсіву "застарілого" тексту)
    let idОстаннього = null;
    let останнійUrlId = null;
    let таймерПеревірки = null;
    let таймериСтартових = new Array();
    let останнійЛогОчікування = null;
    const очікуванняПідтвердження = new Map(); // id -> { плеєр, текст, джерело, результат }
    const відхиленіId = new Set();             // id, для яких DOM-маркер не підтверджено мережею

    const СЕЛЕКТОРИ_АВТОРА_SHORTS =
        'h2.title, #headline, .title, #channel-name, ytd-channel-name, .headline-text, ' +
        '.shorts-description-text, #description-text, ' +
        'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-structured-description"], ' +
        '.ytd-structured-description-content-renderer';

    function отриматиIdПоточногоShorts() {
        const match = window.location.pathname.match(/\/shorts\/([^/?]+)/);
        return match ? match[1] : null; // чистий рядок ID
    }

    function записатиРішення(id, вердикт, підпис) {
        рішення.set(id, { вердикт, підпис });
        if (рішення.size > 200) {
            рішення.delete(рішення.keys().next().value);
        }
    }

    // Активний плеєр: лише той, що відповідає поточному URL (сусідні плеєри мають свій, "чужий" текст)
    function отриматиАктивнийПлеєр() {
        const активний = document.querySelector('ytd-reel-video-renderer[is-active]');
        if (активний) return активний;

        let найкращий = null;
        let макс = 0;
        document.querySelectorAll('ytd-reel-video-renderer[data-ua-visible]').forEach((п) => {
            const r = parseFloat(п.getAttribute('data-ua-visible')) || 0;
            if (r >= макс) {
                макс = r;
                найкращий = п;
            }
        });
        return найкращий;
    }

    // Збір тексту ТІЛЬКИ автора: заголовок, канал, опис (без кнопок інтерфейсу YouTube)
    function зібратиТекстАвтора(плеєр) {
        const перший = (sel) => {
            const e = плеєр.querySelector(sel);
            return e ? (e.innerText || e.textContent || '').trim() : '';
        };
        const заголовок = перший('h2.title, #headline, .title');
        const автор = перший('#channel-name, ytd-channel-name, .headline-text');
        const опис = перший('.shorts-description-text, #description-text');

        // Панель опису: лише видимий текст (innerText), щоб не підхопити застарілий прихований вміст
        const панель = document.querySelector(
            'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-structured-description"], .ytd-structured-description-content-renderer'
        );
        const текстПанелі = панель ? (панель.innerText || '').trim() : '';

        return [заголовок, автор, опис, текстПанелі].filter(Boolean).join(' ').trim();
    }

    function заглушити(плеєр) {
        const v = плеєр ? плеєр.querySelector('video') : null;
        if (v && !v.muted) {
            v.muted = true;
            заглушеніВідео.add(v);
        }
    }

    function розглушитиВсе() {
        заглушеніВідео.forEach((v) => {
            try { v.muted = false; } catch (e) { /* ігноруємо */ }
        });
        заглушеніВідео.clear();
    }

    function натиснутиНаступне(id) {
        if (отриматиIdПоточногоShorts() !== id) {
            // log('⏭ Вже на іншому відео, скіп не потрібен. ID:', id);
            return;
        }

        const кнопкаНаступного = document.querySelector(
            '#navigation-button-down button, ytd-reel-player-overlay-renderer #next-btn, ' +
            'button[aria-label="Наступне відео"], button[aria-label="Next video"]'
        );

        if (кнопкаНаступного) {
            // log('🖱 Скіп: клік по кнопці "наступне". ID:', id);
            кнопкаНаступного.click();
        } else {
            // log('⌨️ Скіп: кнопку не знайдено, шлю ArrowDown. ID:', id);
            const подіяКлавіші = () => new KeyboardEvent('keydown', {
                key: 'ArrowDown',
                keyCode: 40,
                code: 'ArrowDown',
                which: 40,
                bubbles: true,
                cancelable: true
            });
            const shorts = document.querySelector('ytd-shorts');
            if (shorts) shorts.dispatchEvent(подіяКлавіші());
            document.dispatchEvent(подіяКлавіші());
        }
    }

    function виконатиСкіп(плеєр, id, текст, джерело, рахувати, результат) {
        текстОстаннього = текст || '';
        idОстаннього = id;
        спробиСкіпу.set(id, { n: 1, t: Date.now() });

        // Зберігаємо маркер у рішенні, щоб він був видимий і при повторному скіпі (повернення на відео)
        const збережене = рішення.get(id);
        if (збережене && результат) збережене.результат = результат;
        const маркер = результат || (збережене ? збережене.результат : null);
        if (маркер) {
            // logStyled(
            // '🎯 МАРКЕР: тип = ' + маркер.тип + ' | слово = "' + маркер.збіг + '" | контекст = "' + маркер.фрагмент + '"',
            // 'color: #ff9900; font-weight: bold;'
            // );
        } else {
            // log('🎯 Маркер невідомий (немає збереженого результату). Джерело:', джерело);
        }

        // logStyled('❌ ВОРОЖИЙ КОНТЕНТ (' + джерело + '). Блокую та перегортаю. ID: ' + id, 'color: #ff3333; font-weight: bold;');

        // РЕЛІЗ: єдине повідомлення при спрацьовуванні скіпу (ID русявого відео + маркер)
        if (маркер) {
            console.log(LOG + ' ❌ СКІП. ID: ' + id + ' | джерело: ' + джерело + ' | тип: ' + маркер.тип + ' | слово: "' + маркер.збіг + '" | контекст: "' + маркер.фрагмент + '"');
        } else {
            console.log(LOG + ' ❌ СКІП. ID: ' + id + ' | джерело: ' + джерело + ' | маркер невідомий');
        }

        if (рахувати !== false) збільшитиЛічильникСкіпів();
        заглушити(плеєр);
        setTimeout(() => натиснутиНаступне(id), 150);
    }

    // Шлях елемента в DOM для дебагу (щоб бачити, де саме лежить текст)
    function шляхЕлемента(el) {
        const частини = new Array();
        let e = el;
        while (e && e.nodeType === 1 && частини.length < 8) {
            let s = e.tagName.toLowerCase();
            if (e.id) s += '#' + e.id;
            const tid = e.getAttribute ? e.getAttribute('target-id') : null;
            if (tid) s += '[target-id=' + tid + ']';
            if (typeof e.className === 'string' && e.className.trim()) {
                s += '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.');
            }
            частини.push(s);
            e = e.parentElement;
        }
        return частини.join(' < ');
    }

    // Опис і заголовок з мережі: працює без відкриття вікна "Про відео" і не залежить від DOM
    const описиЗМережі = new Map();          // id -> текст (заголовок + опис)
    const запитиОписуВПроцесі = new Set();

    function запроситиОпис(id) {
        if (!id || описиЗМережі.has(id) || запитиОписуВПроцесі.has(id)) return;
        запитиОписуВПроцесі.add(id);

        fetch('https://www.youtube.com/watch?v=' + encodeURIComponent(id), { credentials: 'same-origin' })
            .then((r) => r.text())
            .then((html) => {
                const розкодувати = (сирий) => {
                    try { return JSON.parse('"' + сирий + '"'); } catch (e) { return сирий; }
                };
                const mОпис = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
                const mНазва = html.match(/"videoDetails":\{"videoId":"[^"]+","title":"((?:[^"\\]|\\.)*)"/);
                const назва = mНазва ? розкодувати(mНазва[1]) : '';
                const опис = mОпис ? розкодувати(mОпис[1]) : '';
                const mАвтор = html.match(/"author":"((?:[^"\\]|\\.)*)"/);
                const автор = mАвтор ? розкодувати(mАвтор[1]) : '';
                const текст = (назва + ' ' + автор + ' ' + опис).trim();

                описиЗМережі.set(id, текст);
                if (описиЗМережі.size > 100) {
                    описиЗМережі.delete(описиЗМережі.keys().next().value);
                }
                // log('🌐 Опис отримано з мережі. ID:', id, '| довжина тексту:', текст.length);
                перевіритиОписЗМережі(id);
            })
            .catch((помилка) => {
                // log('⚠️ Не вдалося отримати опис з мережі. ID:', id, помилка);
                const п = очікуванняПідтвердження.get(id);
                if (п) {
                    очікуванняПідтвердження.delete(id);
                    скіпЗаDOMБезПідтвердження(id, п, 'мережа недоступна');
                }
            })
            .finally(() => запитиОписуВПроцесі.delete(id));
    }

    function перевіритиОписЗМережі(id) {
        const очікує = очікуванняПідтвердження.get(id);
        if (очікує) {
            очікуванняПідтвердження.delete(id);
            if (отриматиIdПоточногоShorts() === id) розглянутиПропозиціюСкіпу(id, очікує);
            return;
        }
        if (отриматиIdПоточногоShorts() !== id) return; // користувач уже на іншому відео
        const запис = рішення.get(id);
        if (запис && запис.вердикт === 'skip') return;

        const текст = описиЗМережі.get(id);
        if (!текст) return;

        const результат = знайтиМаркерВорожостi(текст);
        if (!результат) {
            // log('✨ Опис із мережі чистий. ID:', id);
            return;
        }

        // console.group(LOG + ' 🌐 МАРКЕР В ОПИСІ З МЕРЕЖІ');
        // log('ID відео:', id);
        // log('Тип патерна:', результат.тип);
        // log('Що саме знайшли:', JSON.stringify(результат.збіг));
        // log('Контекст:', JSON.stringify(результат.фрагмент));
        // console.groupEnd();

        записатиРішення(id, 'skip', текст);
        виконатиСкіп(отриматиАктивнийПлеєр(), id, текст, 'опис із мережі', true, результат);
    }

    // Підтвердження DOM-маркера описом з мережі (захист від службового/застарілого тексту в DOM)
    function скіпЗаDOMБезПідтвердження(id, п, причина) {
        if (отриматиIdПоточногоShorts() !== id) return;
        // log('⚠️ Скіп за DOM-маркером без підтвердження мережею (' + причина + '). ID:', id);
        записатиРішення(id, 'skip', п.текст);
        виконатиСкіп(отриматиАктивнийПлеєр() || п.плеєр, id, п.текст, п.джерело + ' (без підтвердження мережею)', true, п.результат);
    }

    function розглянутиПропозиціюСкіпу(id, п) {
        const мережа = описиЗМережі.get(id);
        if (!мережа) {
            скіпЗаDOMБезПідтвердження(id, п, 'опис із мережі порожній');
            return;
        }
        const мРезультат = знайтиМаркерВорожостi(мережа);
        if (мРезультат) {
            // log('✅ DOM-маркер підтверджено описом з мережі. ID:', id, '| слово в мережевому тексті:', JSON.stringify(мРезультат.збіг));
            записатиРішення(id, 'skip', п.текст);
            виконатиСкіп(отриматиАктивнийПлеєр() || п.плеєр, id, п.текст, п.джерело + ' + підтверджено мережею', true, п.результат);
        } else {
            if (!відхиленіId.has(id)) {
                відхиленіId.add(id);
                // log('🛑 DOM-маркер НЕ підтверджено описом з мережі — скіп скасовано. ID:', id,
                // '| слово DOM:', JSON.stringify(п.результат.збіг), '| джерело:', п.джерело);
            }
            записатиРішення(id, 'clean', п.текст);
        }
    }

    function запропонуватиСкіп(плеєр, id, текст, джерело, результат) {
        const запис = рішення.get(id);
        if (запис && запис.вердикт === 'skip') return;
        if (очікуванняПідтвердження.has(id)) return;

        const п = { плеєр, текст, джерело, результат };
        if (описиЗМережі.has(id)) {
            розглянутиПропозиціюСкіпу(id, п);
            return;
        }

        // log('🕒 DOM-маркер знайдено (' + джерело + '), чекаю підтвердження описом з мережі. ID:', id, '| слово:', JSON.stringify(результат.збіг));
        очікуванняПідтвердження.set(id, п);
        запроситиОпис(id);

        setTimeout(() => {
            const очікує = очікуванняПідтвердження.get(id);
            if (!очікує) return;
            очікуванняПідтвердження.delete(id);
            скіпЗаDOMБезПідтвердження(id, очікує, 'опис із мережі не прийшов за 1500 мс');
        }, 1500);
    }

    // Перевірка активного Shorts за текстом автора
    function перевіритиShorts(причина) {
        const id = отриматиIdПоточногоShorts();
        if (!id) return;

        const плеєр = отриматиАктивнийПлеєр();
        if (!плеєр) return;

        const запис = рішення.get(id);
        if (запис && запис.вердикт === 'skip') return; // вже скіпаємо це відео

        const текст = зібратиТекстАвтора(плеєр);
        if (текст.length < 2) return; // текст ще не підвантажився

        if (запис && запис.підпис === текст) return; // нічого нового

        // Якщо текст ідентичний тексту щойно скіпнутого відео — це "застарілий" текст попереднього відео, чекаємо оновлення
        if (текстОстаннього && idОстаннього !== id && текст === текстОстаннього) {
            if (останнійЛогОчікування !== id) {
                останнійЛогОчікування = id;
                // log('⏳ Текст у DOM ще від попереднього (скіпнутого) відео, чекаю оновлення. ID:', id, '| причина перевірки:', причина);
            }
            return;
        }

        const результат = знайтиМаркерВорожостi(текст);

        // Захист: за час сканування відео могло змінитись
        if (отриматиIdПоточногоShorts() !== id) {
            // log('⚠️ ID відео змінився під час сканування. Результат відхилено.');
            return;
        }

        if (результат) {
            // console.group(LOG + ' 🔎 МАРКЕР СПРАЦЮВАВ В SHORTS');
            // log('ID відео:', id);
            // log('Причина перевірки:', причина);
            // log('Тип патерна:', результат.тип);
            // log('Що саме знайшли:', JSON.stringify(результат.збіг));
            // log('Контекст:', JSON.stringify(результат.фрагмент));
            // console.groupEnd();

            запропонуватиСкіп(плеєр, id, текст, 'сканер Shorts', результат);
        } else {
            записатиРішення(id, 'clean', текст);
            // logStyled('✨ Відео чисте. ID: ' + id + ' | причина перевірки: ' + причина, 'color: #00cc00; font-weight: bold;');
        }
    }

    // Передача маркера з загального текстового сканера у скіпер Shorts
    function передатиМаркерУShorts(element, результат, текстЕлемента) {
        const id = отриматиIdПоточногоShorts();
        if (!id) return;

        // Не передаємо маркер з коментарів і навігації сайту (чорний список).
        // Усе інше на сторінці Shorts (заголовок, канал, опис, вікно "Про відео") вважаємо текстом автора.
        const чорнийСписок =
            'ytd-comments, ytd-comment-thread-renderer, ytd-comment-view-model, ytd-comment-renderer, #comments, ' +
            'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-comments-section"], ' +
            'ytd-masthead, ytd-guide-renderer, ytd-mini-guide-renderer, tp-yt-app-drawer, ytd-searchbox, ytd-compact-video-renderer';
        const шлях = шляхЕлемента(element);
        if (element.closest(чорнийСписок)) {
            // log('ℹ️ Маркер на сторінці Shorts, але це коментарі/навігація — скіп не запускаю. Слово:', JSON.stringify(результат.збіг), '| шлях:', шлях);
            return;
        }

        const активний = отриматиАктивнийПлеєр();
        const власнийПлеєр = element.closest('ytd-reel-video-renderer');
        if (власнийПлеєр && власнийПлеєр !== активний) {
            // log('⏭ Маркер у НЕактивному плеєрі (сусіднє відео) — для скіпу ігнорую. Слово:', JSON.stringify(результат.збіг));
            return;
        }

        const запис = рішення.get(id);
        if (запис && запис.вердикт === 'skip') return;

        if (текстОстаннього && idОстаннього !== id && текстОстаннього.includes(текстЕлемента)) {
            // log('⏳ Маркер із тексту попереднього скіпнутого відео — ігнорую. ID:', id);
            return;
        }

        // console.group(LOG + ' 🔗 DOM-СКАНЕР → SHORTS');
        // log('ID відео:', id);
        // log('Де лежить текст (шлях DOM):', шлях);
        // log('Тип патерна:', результат.тип);
        // log('Що саме знайшли:', JSON.stringify(результат.збіг));
        // log('Контекст:', JSON.stringify(результат.фрагмент));
        // console.groupEnd();

        запропонуватиСкіп(активний, id, текстЕлемента, 'checkAndBlur → Shorts', результат);
    }

    // Цикл: підключити спостереження за плеєрами + перевірити активний
    const спостерігачЕкрана = new IntersectionObserver((записи) => {
        записи.forEach((з) => {
            if (з.isIntersecting && з.intersectionRatio >= 0.5) {
                з.target.setAttribute('data-ua-visible', з.intersectionRatio.toFixed(2));
            } else {
                з.target.removeAttribute('data-ua-visible');
            }
        });
        запланувати('IntersectionObserver');
    }, { threshold: new Array(0.1, 0.2, 0.5, 0.8) });

    function циклShorts(причина) {
        if (!отриматиIdПоточногоShorts()) return;
        document.querySelectorAll('ytd-reel-video-renderer').forEach((плеєр) => {
            if (!плеєр.hasAttribute('data-ua-watch')) {
                плеєр.setAttribute('data-ua-watch', 'true');
                спостерігачЕкрана.observe(плеєр);
            }
        });
        перевіритиShorts(причина);
    }

    function запланувати(причина) {
        if (таймерПеревірки) return;
        таймерПеревірки = setTimeout(() => {
            таймерПеревірки = null;
            циклShorts('зміна DOM (' + причина + ')');
        }, 120);
    }

    function запланувативСтартовіПеревірки(причина) {
        таймериСтартових.forEach((т) => clearTimeout(т));
        таймериСтартових = new Array();
        new Array(50, 150, 300, 600, 1000, 1600).forEach((мс) => {
            таймериСтартових.push(setTimeout(() => циклShorts(причина + ' +' + мс + 'мс'), мс));
        });
    }

    // Відстеження зміни відео за URL (Shorts — SPA, подія навігації не завжди спрацьовує)
    function відстежитиЗмінуВідео() {
        const id = отриматиIdПоточногоShorts();

        if (id !== останнійUrlId) {
            const було = останнійUrlId;
            останнійUrlId = id;
            if (!id) return;

            // log('🔄 Нове відео в Shorts:', id, '(було:', було, ')');
            розглушитиВсе();

            const запис = рішення.get(id);
            if (запис && запис.вердикт === 'skip') {
                // log('↩️ Повернулись на раніше скіпнуте відео:', id);
                виконатиСкіп(отриматиАктивнийПлеєр(), id, запис.підпис, 'повернення на скіпнуте', false, запис.результат);
            }
            запланувативСтартовіПеревірки('зміна відео');

            if (описиЗМережі.has(id)) {
                перевіритиОписЗМережі(id);
            } else {
                запроситиОпис(id);
            }
            return;
        }

        // Те саме відео: якщо скіп не спрацював — повторюємо (до 3 разів)
        if (id) {
            const запис = рішення.get(id);
            const с = спробиСкіпу.get(id);
            if (запис && запис.вердикт === 'skip' && с && с.n < 3 && Date.now() - с.t > 900) {
                с.n++;
                с.t = Date.now();
                // log('🔁 Повторна спроба скіпу. ID:', id, '| спроба:', с.n);
                натиснутиНаступне(id);
            }
        }
    }

    // ==================== ЗАГАЛЬНИЙ БЛЮР ТЕКСТУ ====================
    // 6.5: максимальна довжина тексту контейнера, який дозволено блюрити цілком.
    // Якщо найближчий контейнер більший (напр. article#feed на ukr.net = уся стрічка новин),
    // блюриться лише сам елемент з маркером.
    const МАКС_ТЕКСТ_КОНТЕЙНЕРА = 1500;

    const знятиБлюр = (контейнер) => {
        контейнер.classList.remove('antirus-blurred');
        контейнер.style.filter = '';
        контейнер.style.opacity = '';
        контейнер.style.pointerEvents = '';
        контейнер.style.transition = '';
    };

    const checkAndBlur = (element) => {
        if (!element || element.nodeType !== 1) return;
        if (new Array('SCRIPT', 'STYLE', 'NOSCRIPT', 'INPUT', 'TEXTAREA', 'CODE', 'BODY', 'HTML').includes(element.tagName)) return;

        // Якщо елемент уже заблюрений, а текст у ньому змінився на чистий (YouTube перевикористовує вузли) — знімаємо блюр
        const вжеЗаблюрений = element.closest('.antirus-blurred');
        if (вжеЗаблюрений) {
            const текстЗаблюреного = (вжеЗаблюрений.textContent || '').replace(/[?:!.,_]/g, ' ');
            if (знайтиМаркерВорожостi(текстЗаблюреного)) return; // і далі ворожий
            // log('✨ Текст у заблюреному елементі став чистим — знімаю блюр.');
            знятиБлюр(вжеЗаблюрений);
        }

        const directText = (element.textContent || element.innerText || '').trim();

        if (/^[0-9:.\s%]+$/.test(directText)) return;
        if (directText.includes('відтворення незабаром не почнеться')) return;
        if (directText.length <= 1 || directText.length > 1500) return; // надто великі контейнери не аналізуємо

        const cleanTextForCheck = directText.replace(/[?:!.,_]/g, ' ');
        const результат = знайтиМаркерВорожостi(cleanTextForCheck);
        if (!результат) return;

        const кандидатКонтейнера = element.closest(
            'ytd-comment-thread-renderer, ytd-comment-view-model, ytd-comment-renderer, li, article, p, a, tr, td, h1, h2, h3, h4, h5, h6'
        ) || element;

        // 6.5: захист від "блюру всієї стрічки" — завеликий контейнер не блюримо, лише сам елемент
        const довжинаКонтейнера = (кандидатКонтейнера.textContent || '').length;
        const контейнерЗавеликий = довжинаКонтейнера > МАКС_ТЕКСТ_КОНТЕЙНЕРА;
        const container = контейнерЗавеликий ? element : кандидатКонтейнера;

        container.classList.add('antirus-blurred');
        container.style.filter = 'blur(12px)';
        container.style.opacity = '0.15';
        container.style.pointerEvents = 'none';
        container.style.transition = 'filter 0.2s ease';

        // ДЕБАГ: опис кожного блюру (що саме спричинило, який елемент і який контейнер блюриться)
        if (DEBUG) {
            console.log(
                LOG + ' 🧪 БЛЮР | тип: ' + результат.тип +
                ' | слово: "' + результат.збіг + '"' +
                ' | контекст: "' + результат.фрагмент + '"' +
                ' | елемент: ' + element.tagName +
                ' | контейнер: ' + container.tagName + (container.id ? '#' + container.id : '') +
                ' | довжина кандидата: ' + довжинаКонтейнера +
                (контейнерЗавеликий ? ' | ⚠️ контейнер завеликий, блюрю лише елемент' : '') +
                ' | шлях: ' + шляхЕлемента(element)
            );
        }

        // console.group(LOG + ' 📝 ЗНАЙДЕНО ВОРОЖИЙ ТЕКСТ НА СТОРІНЦІ');
        // log('ID поточного Shorts:', отриматиIdПоточногоShorts());
        // log('Тип патерна:', результат.тип);
        // log('Слово-маркер:', JSON.stringify(результат.збіг));
        // log('Контекст елемента:', JSON.stringify(результат.фрагмент));
        // console.groupEnd();

        // Якщо маркер у тексті автора/опису активного Shorts — передаємо в скіпер
        передатиМаркерУShorts(element, результат, directText);
    };

    const scanDOM = (rootNode) => {
        if (!rootNode) return;
        const elements = rootNode.querySelectorAll ? rootNode.querySelectorAll(
            'a, p, span, li, td, h1, h2, h3, h4, h5, h6, ' +
            'yt-formatted-string, .yt-core-attributed-string, #video-title, #video-title-link, ' +
            '#content-text, ytd-comment-renderer, ytd-comment-thread-renderer, ' +
            '.tiktok-comment-text, .tiktok-user-desc, [class*="desc"], [class*="comment"]'
        ) : new Array();
        elements.forEach(checkAndBlur);
    };

    // ==================== СПОСТЕРІГАЧІ ====================
    const єЮтубом = window.location.hostname.includes('youtube.com');
    const тегиДляПрямоїПеревірки = new Array('A', 'P', 'SPAN', 'LI', 'TD', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'YT-FORMATTED-STRING');

    const спостерігачСтруктури = new MutationObserver((mutations) => {
        let щосьЗмінилось = false;

        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes') {
                щосьЗмінилось = true; // зміна is-active
                return;
            }
            if (mutation.type === 'characterData') {
                checkAndBlur(mutation.target.parentElement);
                щосьЗмінилось = true;
                return;
            }
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (тегиДляПрямоїПеревірки.includes(node.tagName)) {
                        checkAndBlur(node);
                    }
                    scanDOM(node);
                    щосьЗмінилось = true;
                }
            });
        });

        if (єЮтубом && щосьЗмінилось) запланувати('MutationObserver');
    });

    scanDOM(document.body || document.documentElement);

    спостерігачСтруктури.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: new Array('is-active')
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', створитиЛічильникЯкщоТреба);
    } else {
        створитиЛічильникЯкщоТреба();
    }

    if (єЮтубом) {
        setInterval(відстежитиЗмінуВідео, 250);

        document.addEventListener('yt-navigate-finish', () => {
            відстежитиЗмінуВідео();
            запланувативСтартовіПеревірки('yt-navigate-finish');
        });
    }
})();
