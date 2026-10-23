// Generated from src/js/*.js by `pnpm compose`. Edit the ordered fragments.
// ══════════════════════════════════════════════════════════════
// PARTICLE CLASS
// ══════════════════════════════════════════════════════════════
let SPECTRAL_LIGHT = false; // theme-aware flag, updated by applyTheme
class Particle {
    constructor(x, y, size, speedX, speedY, hue) {
        this.x = x; this.y = y; this.size = size; this.baseSize = size;
        this.speedX = speedX; this.speedY = speedY;
        this.hue = hue; this.hueSpeed = 0.1 + Math.random() * 0.2;
        this.saturation = 50 + Math.random() * 30;
        this.lightness = 50 + Math.random() * 20;
        this.opacity = 0.3 + Math.random() * 0.4;
    }
    update(W, H, mouse, frameStep = 1) {
        this.hue = (this.hue + this.hueSpeed * frameStep) % 360;
        this.x += this.speedX * frameStep; this.y += this.speedY * frameStep;
        if (mouse.active) {
            const dx = this.x - mouse.x, dy = this.y - mouse.y;
            const distSq = dx*dx + dy*dy, maxDist = 150;
            if (distSq < maxDist*maxDist && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const force = (maxDist - dist) / maxDist;
                const impulse = force * 0.11 * frameStep / dist;
                this.speedX += dx * impulse;
                this.speedY += dy * impulse;
                this.size = this.baseSize + force * 2.5;
            } else { this.size += (this.baseSize - this.size) * Math.min(.16, .05 * frameStep); }
        } else { this.size += (this.baseSize - this.size) * Math.min(.1, .02 * frameStep); }
        const damping = Math.pow(.98, frameStep);
        this.speedX *= damping; this.speedY *= damping;
        const s = Math.sqrt(this.speedX*this.speedX + this.speedY*this.speedY);
        if (s < 0.05) { const a = Math.random()*Math.PI*2; this.speedX = Math.cos(a)*0.05; this.speedY = Math.sin(a)*0.05; }
        if (s > 1.2) { this.speedX = (this.speedX/s)*1.2; this.speedY = (this.speedY/s)*1.2; }
        if (this.x > W+20) this.x = -20; if (this.x < -20) this.x = W+20;
        if (this.y > H+20) this.y = -20; if (this.y < -20) this.y = H+20;
    }
    draw(ctx, lowPower = false) {
        // On light theme, render darker/more saturated dots so they stay visible
        const L = SPECTRAL_LIGHT ? Math.min(this.lightness, 46) : this.lightness;
        const S = SPECTRAL_LIGHT ? Math.min(this.saturation + 18, 92) : this.saturation;
        const color = `hsl(${this.hue},${S}%,${L}%)`;
        ctx.globalAlpha = SPECTRAL_LIGHT ? Math.min(this.opacity + 0.22, 0.85) : this.opacity;
        ctx.shadowBlur = lowPower ? 0 : (SPECTRAL_LIGHT ? 3 : 7); ctx.shadowColor = color; ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
        if (!SPECTRAL_LIGHT && this.opacity > 0.25) {
            ctx.shadowBlur = lowPower ? 0 : 12; ctx.globalAlpha = this.opacity * 0.11;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size*3, 0, Math.PI*2); ctx.fill();
        }
    }
}
// Site copy is authored in English. The Russian catalog is loaded next in the
// source manifest, before any application rendering begins.
window.SpectralI18n = (() => {
    const catalog = new Map();
    const textOrigins = new WeakMap();
    const attributeOrigins = new WeakMap();
    const attributes = ['aria-label', 'aria-description', 'title', 'data-site-tip', 'placeholder', 'alt', 'content'];
    const blockedText = 'script, style, pre, code, textarea, [contenteditable], [translate="no"]';
    const blockedAttributes = 'script, style, pre, code, [contenteditable], [translate="no"]';
    let language = 'en';
    let observer;
    let queued = false;
    let changingLanguage = false;
    let pendingLanguage = null;

    try { language = localStorage.getItem('spectral-language') === 'ru' ? 'ru' : 'en'; }
    catch { /* Storage can be disabled in private browser modes. */ }
    document.documentElement.lang = language;

    const normalize = value => value.replace(/\s+/g, ' ').trim();
    function addCatalog(lines) {
        for (const line of lines.split('\n')) {
            const separator = line.indexOf('\t');
            if (separator < 0) continue;
            const english = line.slice(0, separator).trim();
            const russian = line.slice(separator + 1).trim();
            if (english && russian) catalog.set(english, russian);
        }
    }

    function translate(value) {
        const key = normalize(value);
        let translated = catalog.get(key);
        if (!translated) {
            const accountLabel = key.match(/^Open account panel for (.+)$/);
            if (accountLabel) translated = `Открыть панель аккаунта ${accountLabel[1]}`;
        }
        if (!translated) {
            const dynamicLabel = key.match(/^(Role for|Select|Pending avatar for|by) (.+)$/);
            if (dynamicLabel) {
                const prefixes = { 'Role for':'Роль для', Select:'Выбрать', 'Pending avatar for':'Аватар на проверке у', by:'от' };
                translated = `${prefixes[dynamicLabel[1]]} ${dynamicLabel[2]}`;
            }
        }
        if (!translated) {
            const deleteRelease = key.match(/^Delete update "(.+)"\?$/);
            if (deleteRelease) translated = `Удалить обновление «${catalog.get(deleteRelease[1])||deleteRelease[1]}»?`;
        }
        if (!translated) {
            const relativeTime = key.match(/^(\d+)\s?(m|h|d|mo) ago$/);
            if (relativeTime) {
                const units = { m:'мин', h:'ч', d:'дн', mo:'мес' };
                translated = `${relativeTime[1]} ${units[relativeTime[2]]} назад`;
            }
        }
        if (!translated) {
            const voteCount = key.match(/^(\d+) upvotes?$/);
            if (voteCount) {
                const number = Number(voteCount[1]);
                const noun = number % 10 === 1 && number % 100 !== 11 ? 'голос'
                    : number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 12 || number % 100 > 14) ? 'голоса' : 'голосов';
                translated = `${number} ${noun}`;
            }
        }
        if (!translated) {
            const count = key.match(/^(\d+) (changes?|added|improved|fixed|items?|users?|selected|ideas?|guides?|requests?|friends?|profiles?|favorites?|slots?)$/);
            if (count) {
                const number = Number(count[1]);
                const ending = number % 10 === 1 && number % 100 !== 11 ? 0
                    : number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 12 || number % 100 > 14) ? 1 : 2;
                const nouns = {
                    changes: ['изменение', 'изменения', 'изменений'],
                    change: ['изменение', 'изменения', 'изменений'],
                    added: ['добавлено', 'добавлено', 'добавлено'],
                    improved: ['улучшено', 'улучшено', 'улучшено'],
                    fixed: ['исправлено', 'исправлено', 'исправлено'],
                    items: ['пункт', 'пункта', 'пунктов'],
                    item: ['пункт', 'пункта', 'пунктов'],
                    users: ['пользователь', 'пользователя', 'пользователей'],
                    user: ['пользователь', 'пользователя', 'пользователей'],
                    selected: ['выбран', 'выбрано', 'выбрано'],
                    ideas: ['идея', 'идеи', 'идей'],
                    idea: ['идея', 'идеи', 'идей'],
                    guides: ['руководство', 'руководства', 'руководств'],
                    guide: ['руководство', 'руководства', 'руководств'],
                    requests: ['запрос', 'запроса', 'запросов'],
                    request: ['запрос', 'запроса', 'запросов'],
                    friends: ['друг', 'друга', 'друзей'],
                    friend: ['друг', 'друга', 'друзей'],
                    profiles: ['профиль', 'профиля', 'профилей'],
                    profile: ['профиль', 'профиля', 'профилей'],
                    favorites: ['избранный', 'избранных', 'избранных'],
                    favorite: ['избранный', 'избранных', 'избранных'],
                    slots: ['слот', 'слота', 'слотов'],
                    slot: ['слот', 'слота', 'слотов']
                };
                translated = `${number} ${nouns[count[2]][ending]}`;
            }
        }
        if (!translated) {
            const date = key.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4})$/);
            if (date) {
                const months = { Jan:'янв.', Feb:'февр.', Mar:'марта', Apr:'апр.', May:'мая', Jun:'июня', Jul:'июля', Aug:'авг.', Sep:'сент.', Oct:'окт.', Nov:'нояб.', Dec:'дек.' };
                translated = `${date[2]} ${months[date[1]]} ${date[3]}`;
            }
        }
        if (!translated) return value;
        const leading = value.match(/^\s*/)?.[0] || '';
        const trailing = value.match(/\s*$/)?.[0] || '';
        return leading + translated + trailing;
    }

    function syncText(node) {
        if (!node.nodeValue?.trim() || node.parentElement?.closest(blockedText)) return;
        let origin = textOrigins.get(node);
        if (!origin || node.nodeValue !== origin.output) {
            origin = { english: node.nodeValue, output: node.nodeValue };
            textOrigins.set(node, origin);
        }
        const next = language === 'ru' ? translate(origin.english) : origin.english;
        if (node.nodeValue !== next) {
            origin.output = next;
            node.nodeValue = next;
        }
    }

    function syncAttributes(element) {
        if (element.closest(blockedAttributes)) return;
        let origins = attributeOrigins.get(element);
        if (!origins) {
            origins = new Map();
            attributeOrigins.set(element, origins);
        }
        for (const attribute of attributes) {
            const current = element.getAttribute(attribute);
            if (current === null) continue;
            let origin = origins.get(attribute);
            if (!origin || current !== origin.output) {
                origin = { english: current, output: current };
                origins.set(attribute, origin);
            }
            const next = language === 'ru' ? translate(origin.english) : origin.english;
            if (current !== next) {
                origin.output = next;
                element.setAttribute(attribute, next);
            }
        }
    }

    function syncTree(root = document.body) {
        if (!root) return;
        if (root.nodeType === Node.TEXT_NODE) { syncText(root); return; }
        if (root.nodeType !== Node.ELEMENT_NODE || root.closest(blockedAttributes)) return;
        syncAttributes(root);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.nodeType === Node.TEXT_NODE) syncText(node);
            else syncAttributes(node);
        }
    }

    function syncMetadata() {
        const title = document.querySelector('title');
        const description = document.querySelector('meta[name="description"]');
        if (title) syncText(title.firstChild);
        if (description) syncAttributes(description);
    }

    function refresh() {
        syncTree();
        syncMetadata();
    }

    function setLanguage(next) {
        language = next === 'ru' ? 'ru' : 'en';
        document.documentElement.lang = language;
        document.documentElement.dataset.language = language;
        try { localStorage.setItem('spectral-language', language); }
        catch { /* The current page still changes language. */ }
        const current = document.getElementById('siteLanguageCurrent');
        if (current) current.textContent = language.toUpperCase();
        document.querySelectorAll('#siteLanguageMenu [data-language]').forEach(option => {
            option.setAttribute('aria-pressed', String(option.dataset.language === language));
        });
        refresh();
        document.dispatchEvent(new CustomEvent('spectral:languagechange', { detail: { language } }));
    }

    function visibleTranslatedText() {
        const candidates = new Set();
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const origin = textOrigins.get(node);
            if (!origin || translate(origin.english) === origin.english) continue;
            const parent = node.parentElement;
            if (!parent || parent.closest('.nav-language-control, [hidden], [aria-hidden="true"]')) continue;
            const element = parent.closest('h1, h2, h3, h4, p, li, button, a, label, summary, small, strong') || parent;
            if (element.closest('.nav-language-control')) continue;
            const rect = element.getBoundingClientRect();
            if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) continue;
            candidates.add(element);
            if (candidates.size >= 70) break;
        }
        const selected = [];
        for (const element of candidates) {
            if (!selected.some(ancestor => ancestor.contains(element))) selected.push(element);
        }
        return selected;
    }

    async function animateLanguageChange(next) {
        pendingLanguage = next === 'ru' ? 'ru' : 'en';
        if (changingLanguage) return;
        changingLanguage = true;
        while (pendingLanguage && pendingLanguage !== language) {
            const desired = pendingLanguage;
            pendingLanguage = null;
            const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || !Element.prototype.animate;
            if (reduced) { setLanguage(desired); continue; }

            const outgoing = visibleTranslatedText().map(element => element.animate(
                [{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(2px)' }],
                { duration: 115, easing: 'ease-in', fill: 'forwards' }
            ));
            await new Promise(resolve => setTimeout(resolve, 130));
            setLanguage(desired);
            outgoing.forEach(animation => animation.cancel());

            // Dynamic sections can redraw in the languagechange listener.
            await Promise.resolve();
            visibleTranslatedText().forEach((element, index) => element.animate(
                [{ opacity: 0, filter: 'blur(3px)', transform: 'translateY(4px)' },
                    { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' }],
                { duration: 300, delay: Math.min(index * 9, 72), easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'backwards' }
            ));
            await new Promise(resolve => setTimeout(resolve, 390));
        }
        changingLanguage = false;
    }

    function bindLanguageControl() {
        const control = document.getElementById('siteLanguageControl');
        const trigger = document.getElementById('siteLanguageToggle');
        const menu = document.getElementById('siteLanguageMenu');
        if (!control || !trigger || !menu) return;
        const options = [...menu.querySelectorAll('[data-language]')];
        const close = (restoreFocus = false) => {
            menu.hidden = true;
            control.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
            if (restoreFocus) trigger.focus();
        };
        const open = (focusOption = false) => {
            menu.hidden = false;
            control.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            if (focusOption) options.find(option => option.dataset.language === language)?.focus();
        };
        trigger.addEventListener('click', () => menu.hidden ? open() : close());
        trigger.addEventListener('keydown', event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                open(true);
            }
        });
        options.forEach((option, index) => {
            option.addEventListener('click', () => {
                close(true);
                void animateLanguageChange(option.dataset.language);
            });
            option.addEventListener('keydown', event => {
                if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                event.preventDefault();
                options[(index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length].focus();
            });
        });
        document.addEventListener('pointerdown', event => {
            if (!menu.hidden && !control.contains(event.target)) close();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !menu.hidden) close(true);
        });
        control.addEventListener('focusout', () => {
            setTimeout(() => {
                if (!control.contains(document.activeElement)) close();
            }, 0);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        bindLanguageControl();
        setLanguage(language);
        observer = new MutationObserver(mutations => {
            if (queued || !mutations.some(mutation => mutation.type !== 'attributes' || attributes.includes(mutation.attributeName))) return;
            queued = true;
            queueMicrotask(() => {
                queued = false;
                refresh();
            });
        });
        observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
    });

    return { addCatalog, setLanguage, getLanguage: () => language, translate, refresh };
})();
window.SpectralI18n.addCatalog(String.raw`
Spectral Launcher | Qt Minecraft Launcher	Spectral Launcher | Лаунчер Minecraft на Qt
Spectral Launcher for Minecraft: Java Edition. Keep builds and worlds separate, install compatible mods and modpacks, select Java, and inspect launch errors.	Spectral Launcher для Minecraft: Java Edition. Разделяйте сборки и миры, устанавливайте совместимые моды и сборки, выбирайте Java и изучайте ошибки запуска.
Skip to main content	Перейти к основному содержимому
Main navigation	Основная навигация
Spectral Launcher — Home	Spectral Launcher — Главная
Primary navigation	Основные разделы
Home	Главная
Accounts	Аккаунты
Updates	Обновления
Development	Разработка
Features	Возможности
Support	Поддержка
Open account panel	Открыть панель аккаунта
YOUR SPACE	ВАШЕ ПРОСТРАНСТВО
Sign In	Войти
Switch to light theme	Включить светлую тему
Switch to dark theme	Включить тёмную тему
Open menu	Открыть меню
Close menu	Закрыть меню
Website language	Язык сайта
Language	Язык
Clear search	Очистить поиск
Show password	Показать пароль
Hide password	Скрыть пароль
Enter your email or username and password.	Введите почту или имя пользователя и пароль.
Website 2.3	Сайт 2.3
Website 2.2	Сайт 2.2
Website 2.1	Сайт 2.1
Website 2.0	Сайт 2.0
Project Core	Основа проекта
Email	Почта
LAUNCHER	ЛАУНЧЕР
Your worlds.	Ваши миры.
Ready to launch.	Готовы к запуску.
A desktop launcher for Minecraft: Java Edition. Keep each build's worlds and mods separate, choose a compatible Java runtime, and inspect launch errors in the Console.	Лаунчер для Minecraft: Java Edition. Храните миры и моды каждой сборки отдельно, выбирайте подходящую Java и проверяйте ошибки запуска в Консоли.
Download	Скачать
Launcher highlights	Главные возможности лаунчера
Your builds	Ваши сборки
One click launch	Запуск одним нажатием
Clear diagnostics	Понятная диагностика
Spectral desktop launcher preview: Play screen, local build, account and friends panel	Предпросмотр лаунчера Spectral: экран запуска, локальная сборка, аккаунт и друзья
Play	Играть
Console	Консоль
Library	Библиотека
Settings	Настройки
Continue playing	Продолжить игру
Survival Realm	Мир выживания
Ready to launch	Готово к запуску
Player profile	Игровой профиль
Guest	Гость
Ready	Готово
Spectral social	Сообщество Spectral
Friends	Друзья
Sign in to see your friends here.	Войдите, чтобы увидеть здесь друзей.
Network ready	Сеть готова
Desktop experience	Приложение для компьютера
Designed around the real Spectral launcher	Основано на настоящем лаунчере Spectral
Explore Spectral	Ознакомиться со Spectral
01 / What changed	01 / Что нового
Release notes	Заметки о выпуске
02 / Under the hood	02 / Как устроено
How it works	Как это работает
03 / Need a hand	03 / Нужна помощь
Find a fix	Найти решение
Core systems	Основные системы
One launcher.	Один лаунчер.
Four connected tools.	Четыре связанных инструмента.
Interactive tour	Интерактивный обзор
Select a tool for a closer look.	Выберите инструмент, чтобы узнать больше.
01 / Library	01 / Библиотека
Instance engine	Управление сборками
Instances	Сборки
Separate Minecraft builds with their own versions, mods, saves and launch settings.	Отдельные сборки Minecraft со своими версиями, модами, сохранениями и настройками запуска.
3 builds	3 сборки
Isolated folders	Отдельные папки
Automatic Java matching	Автоматический подбор Java
Fast switching	Быстрое переключение
In focus	В центре внимания
02 / Content	02 / Контент
Modrinth inside	Modrinth внутри
Mods	Моды
Find compatible mods, resource packs and shaders; check installed Modrinth mods for updates.	Находите совместимые моды, наборы ресурсов и шейдеры; проверяйте обновления установленных модов Modrinth.
Discover	Каталог
Compatible files	Совместимые файлы
Performance · Fabric	Производительность · Fabric
Visuals · Fabric	Графика · Fabric
Update	Обновить
Installed	Установлено
One-click install	Установка одним нажатием
Update history	История обновлений
Version matching	Подбор версии
Focus this tool	Показать инструмент
03 / Identity	03 / Профили
Player profiles	Игровые профили
Switch offline or Ely.by profiles. Sign in to Spectral separately to sync profile details and see friends.	Переключайтесь между автономными профилями и Ely.by. Отдельно войдите в Spectral, чтобы синхронизировать данные профиля и видеть друзей.
Active profile	Активный профиль
Local	Локальный
Offline profile · local play	Автономный профиль · локальная игра
Playtime	Время в игре
Identity	Профиль
Stable UUID	Постоянный UUID
Skin preview	Просмотр скина
Offline UUID	Автономный UUID
Quick switch	Быстрое переключение
04 / Recovery	04 / Восстановление
When launch stops	Если игра не запускается
Diagnostics	Диагностика
Check required files, copy a report, restore supported versions and review likely crash causes.	Проверяйте нужные файлы, копируйте отчёт, восстанавливайте поддерживаемые версии и изучайте возможные причины сбоя.
Check & repair	Проверить и исправить
Report	Отчёт
Why did my build fail?	Почему сборка не запустилась?
Check the Console, Java, libraries and assets. Restore supported version files if needed.	Проверьте Консоль, Java, библиотеки и ресурсы. При необходимости восстановите файлы поддерживаемой версии.
File checks	Проверка файлов
Crash analysis	Анализ сбоев
Copyable report	Отчёт для копирования
Identity cockpit	Центр профилей
Every version of you.	Все ваши игровые образы.
Manage game profile details linked to your Spectral site account and keep your friends close. Sign in to Ely.by separately in the desktop launcher.	Управляйте игровыми профилями, связанными с аккаунтом Spectral, и оставайтесь на связи с друзьями. Вход в Ely.by выполняется отдельно в лаунчере.
Account overview	Обзор аккаунта
Profiles	Профили
Role slots	Слоты роли
Loading your profiles…	Загрузка профилей…
Site account required	Требуется аккаунт сайта
Sign in to manage synced game profile details and friends. Game files and Ely.by authorization remain on your computer.	Войдите, чтобы управлять синхронизированными данными игровых профилей и друзьями. Игровые файлы и авторизация Ely.by остаются на вашем компьютере.
Identity bank	Ваши профили
Your profiles	Ваши профили
Select a profile to save it as your preferred game identity.	Выберите профиль, который будет использоваться по умолчанию.
Add Minecraft profile	Добавить профиль Minecraft
Add profile	Добавить профиль
No Minecraft profiles	Нет профилей Minecraft
Add your first profile	Добавьте первый профиль
Role capacity	Лимит роли
Explore role capacity	Узнать о лимитах ролей
Selected game profile	Выбранный игровой профиль
Site metadata	Данные сайта
Avatar	Аватар
Selected profile	Выбранный профиль
Stable identity code	Постоянный идентификатор
Copy UUID	Скопировать UUID
Copy	Копировать
in game	в игре
added	добавлено
Profile saved	Профиль сохранён
Open the desktop launcher to choose a build and confirm game authorization.	Откройте лаунчер, чтобы выбрать сборку и подтвердить авторизацию в игре.
No profile selected	Профиль не выбран
Add a game profile to start syncing its details.	Добавьте игровой профиль, чтобы синхронизировать его данные.
Player network	Сеть игроков
Find by username…	Поиск по имени…
Friend username	Имя друга
Add friend	Добавить друга
Your player network is empty. Search for someone above.	В списке друзей пока никого нет. Найдите игрока выше.
Friend profiles open in the new public identity view.	Профили друзей открываются в публичном представлении.
Close account dialog	Закрыть окно аккаунта
Add Minecraft Profile	Добавить профиль Minecraft
Profile type	Тип профиля
Save profile name	Сохранить имя профиля
Offline	Автономный
No authentication	Без авторизации
Profile name	Имя профиля
This website saves only the profile name. Connect Ely.by securely in the desktop launcher.	Сайт сохраняет только имя профиля. Безопасно подключите Ely.by в лаунчере.
Add Ely.by Profile	Добавить профиль Ely.by
Username (up to 16 characters)	Имя игрока (до 16 символов)
Offline accounts only work on servers without online verification.	Автономные профили работают только на серверах без онлайн-проверки.
Create Profile	Создать профиль
Spectral timeline	История Spectral
History	История
An editorial timeline of launcher and website features. Dates illustrate the product story; for official release dates and downloads, check	Хронология возможностей лаунчера и сайта. Даты показывают историю продукта; официальные даты выпусков и загрузки доступны в
GitHub Releases	GitHub Releases
Update statistics	Статистика обновлений
Entries	Записи
Changes	Изменения
Latest	Последнее
Latest timeline entry	Последняя запись хронологии
Latest milestone	Последнее событие
Loading update…	Загрузка обновления…
Preparing the latest update notes.	Подготовка заметок о последнем обновлении.
Stable	Стабильная
View update	Открыть обновление
Write Update	Написать обновление
Search features and changes…	Поиск возможностей и изменений…
Filter updates	Фильтр обновлений
All	Все
Added	Добавлено
Improved	Улучшено
Fixed	Исправлено
Important	Важное
No matching updates	Обновления не найдены
Try a different search or change the active filter.	Измените запрос или выберите другой фильтр.
Reset filters	Сбросить фильтры
Under the hood	Как всё устроено
Every launch should be	Каждый запуск должен быть
explainable.	понятным.
Spectral shows the decisions behind each launch, so a failed process leaves a useful trail instead of a silent exit.	Spectral показывает этапы каждого запуска, чтобы вместо внезапного закрытия игры оставался полезный след ошибки.
Trace a launch	Проследить запуск
Spectral build profile	Профиль сборки Spectral
mapped	связано
Interface layer	Уровень интерфейса
Tabs · dialogs · animations · i18n	Вкладки · окна · анимации · перевод
Orchestration	Управление запуском
Command building · process state	Сборка команды · состояние процесса
Services	Сервисы
Java · Versions · Mods	Java · версии · моды
Resolve · install · update	Поиск · установка · обновление
Runtime	Среда запуска
Logs · exit code · diagnostics	Журналы · код выхода · диагностика
Development chapters	Разделы разработки
Technical contents	Техническое содержание
Launch pipeline	Этапы запуска
Subsystems	Подсистемы
Source paths	Исходный код
From Play to process	От кнопки «Играть» до процесса
Pick a step to see what goes in, what the launcher does, and what you can check when it stops.	Выберите этап и узнайте, какие данные поступают, что делает лаунчер и что проверить при сбое.
Launch sequence	Последовательность запуска
Launch steps	Этапы запуска
Read profile	Чтение профиля
Instance & account	Сборка и аккаунт
Resolve version	Проверка версии
Libraries & assets	Библиотеки и ресурсы
Match Java	Подбор Java
Compatible runtime	Совместимая среда
Assemble launch	Подготовка запуска
Command & natives	Команда и нативные файлы
Observe result	Контроль результата
Console & errors	Консоль и ошибки
Step	Этап
Ready to inspect	Готово к просмотру
Read the selected profile	Чтение выбранного профиля
Spectral gathers the instance, account, memory, window and launch preferences before touching the game files.	Spectral собирает настройки сборки, аккаунта, памяти, окна и запуска до работы с игровыми файлами.
Input	Входные данные
Selected instance + player profile	Выбранная сборка + игровой профиль
Output	Результат
One validated GameSettings object	Проверенный объект GameSettings
If the wrong instance opens, check the selection and account before changing Java or mods.	Если открылась не та сборка, сначала проверьте выбор сборки и аккаунта, затем настройки Java и модов.
Previous launch step	Предыдущий этап запуска
1 of 5	1 из 5
Next launch step	Следующий этап запуска
Engineering principle	Принцип разработки
If a launch fails, the last successful stage and the real process error should remain visible.	При сбое должны быть видны последний успешный этап и фактическая ошибка процесса.
Subsystem atlas	Карта подсистем
Choose a layer	Выберите уровень
Launcher architecture	Архитектура лаунчера
Inspect each layer's responsibilities and the data it passes on.	Изучите задачи каждого уровня и передаваемые им данные.
Launcher subsystems	Подсистемы лаунчера
Presentation	Интерфейс
UI, motion and translation	Интерфейс, анимация и перевод
Launcher Core	Ядро лаунчера
Launch state and arguments	Состояние запуска и аргументы
Java Manager	Менеджер Java
Discovery and matching	Поиск и подбор
Content	Контент
Versions & Mods	Версии и моды
Install, browse and update	Установка, каталог и обновление
Profiles, UUIDs and skins	Профили, UUID и скины
Observability	Мониторинг
Console & Logs	Консоль и журналы
Search, export and failures	Поиск, экспорт и сбои
Layer	Уровень
Switch launcher layer	Переключить уровень лаунчера
Show interface layer	Показать интерфейс
Show core layer	Показать ядро
Show Java layer	Показать Java
Show content layer	Показать контент
Show identity layer	Показать профили
Show diagnostics layer	Показать диагностику
The desktop surface for Play, Library, Accounts, Console, settings and dialog flows, with shared styling and RU / EN translation.	Интерфейс вкладок «Играть», «Библиотека», «Аккаунты» и «Консоль», настроек и диалогов с единым стилем и переводом RU / EN.
Technologies	Технологии
Keeps product surfaces visually consistent	Обеспечивает единый стиль интерфейса
Translates state into clear player actions	Превращает состояние в понятные действия
Delivers accessible feedback and dialogs	Показывает понятные сообщения и диалоги
Subsystem signal path	Путь сигнала между подсистемами
Signal path	Путь сигнала
Connected	Связано
Player action	Действие игрока
Handled by	Обработчик
Qt event	Событие Qt
Owns	Отвечает за
Tabs · dialogs · interaction	Вкладки · диалоги · взаимодействие
Connects to	Связано с
LauncherCore · managers	LauncherCore · менеджеры
Source walkthrough	Обзор исходного кода
Read the critical paths	Изучите ключевые участки
Switch files to see how the launcher separates process control, runtime choice and account identity.	Переключайте файлы, чтобы увидеть, как лаунчер разделяет управление процессом, выбор среды и работу с аккаунтом.
Source examples	Примеры исходного кода
File focus	О файле
Launch orchestration	Управление запуском
Turns validated settings and an account into a prepared Minecraft process while keeping failure signals available to the UI.	Превращает проверенные настройки и аккаунт в готовый процесс Minecraft, сохраняя сведения об ошибках для интерфейса.
Responsibility	Задача
Build the classpath and game arguments	Собрать путь классов и аргументы игры
Prepare native libraries	Подготовить нативные библиотеки
Forward output and failures to Console	Передать вывод и ошибки в Консоль
Architecture qualities	Свойства архитектуры
Data model	Модель данных
Local-first	Сначала локально
Localization	Локализация
Explicit errors	Явные ошибки
`);

window.SpectralI18n.addCatalog(String.raw`
Actual Launcher	Настоящий лаунчер
Features that	Возможности, которые
are actually built.	уже работают.
Explore the desktop launcher documented from Spectral 1.9.9. Minecraft: Java Edition builds and game files stay on your computer.	Узнайте о лаунчере Spectral версии 1.9.9. Сборки Minecraft: Java Edition и игровые файлы остаются на вашем компьютере.
Desktop architecture	Архитектура приложения
Desktop Launcher Core	Ядро лаунчера
Written in C++17 with Qt 6 Widgets. The launcher uses native desktop UI, local files and explicit Minecraft process control.	Лаунчер написан на C++17 с Qt 6 Widgets. Он использует нативный интерфейс, локальные файлы и прямое управление процессом Minecraft.
Spectral Console	Консоль Spectral
live	работает
Instance Library	Библиотека сборок
Create, rename, copy, configure and launch separate builds. Each has its own mods, configs, worlds, resource packs, shaders, screenshots and logs. Back up saves before deleting a build.	Создавайте, переименовывайте, копируйте, настраивайте и запускайте отдельные сборки. У каждой свои моды, настройки, миры, ресурсы, шейдеры, скриншоты и журналы. Перед удалением сборки сохраните копию миров.
Separate folders	Отдельные папки
Worlds	Миры
Finds installed or previously downloaded Java, checks compatibility with the selected Minecraft release and can download a suitable runtime. A custom Java path and JVM arguments are global settings.	Находит установленную или ранее загруженную Java, проверяет совместимость с выбранной версией Minecraft и при необходимости загружает подходящую среду. Собственный путь к Java и аргументы JVM задаются для всего лаунчера.
Custom path	Свой путь
Mod Manager	Менеджер модов
Add mods, resource packs and shaders from files or Modrinth. Check compatible Modrinth mods for updates, keep disabled mods disabled and review update history. Per-build auto-check is optional.	Добавляйте моды, наборы ресурсов и шейдеры из файлов или Modrinth. Проверяйте обновления совместимых модов, сохраняйте отключённые моды отключёнными и просматривайте историю обновлений. Автопроверка настраивается для каждой сборки.
Dependencies	Зависимости
Versions & loaders	Версии и загрузчики
Create Vanilla, Fabric or Forge builds and install or restore their version files. The Library version manager warns when a version is in use. Availability depends on the source and loader compatibility.	Создавайте сборки Vanilla, Fabric и Forge, устанавливайте или восстанавливайте файлы версий. Менеджер версий в Библиотеке предупредит, если версия используется. Доступность зависит от источника и совместимости загрузчика.
Modrinth modpacks	Сборки Modrinth
Search Modrinth or import a .mrpack file to create a build with its game version, loader and configuration. Local packs can have no loader or use Fabric, Forge or Quilt; NeoForge packs are rejected.	Ищите сборки на Modrinth или импортируйте файл .mrpack вместе с версией игры, загрузчиком и настройками. Локальные пакеты могут быть без загрузчика или с Fabric, Forge и Quilt; NeoForge не поддерживается.
Catalog	Каталог
Quilt import	Импорт Quilt
Console & recovery	Консоль и восстановление
Follow launch stages and game output with search, timestamps and export. Check required files without launching, copy a report and restore supported versions. Crash analysis suggests likely causes.	Следите за этапами запуска и выводом игры с поиском, временем событий и экспортом. Проверяйте файлы без запуска игры, копируйте отчёт и восстанавливайте поддерживаемые версии. Анализ сбоев подсказывает вероятные причины.
Logs	Журналы
File check	Проверка файлов
Crash report	Отчёт о сбое
Create an offline profile or sign in through Ely.by, including its two-factor code. A Spectral site account separately syncs profile metadata and role-based slots; Ely.by authorization stays on this device.	Создайте автономный профиль или войдите через Ely.by, при необходимости указав код двухфакторной проверки. Аккаунт Spectral отдельно синхронизирует данные профилей и слоты роли; авторизация Ely.by хранится на этом устройстве.
Site sync	Синхронизация сайта
Friends & playtime	Друзья и время в игре
When signed in to Spectral, the Play tab shows friends, status, roles and requests. The launcher also tracks playtime and the last launch for the selected build.	После входа в Spectral вкладка «Играть» показывает друзей, статусы, роли и запросы. Лаунчер также отслеживает время в игре и последний запуск выбранной сборки.
Requests	Запросы
Status	Статус
Screenshots	Скриншоты
Open a build's screenshot gallery from the Library to view images, reveal files or folders and remove unwanted screenshots. Minecraft usually captures them with F2.	Откройте галерею скриншотов сборки в Библиотеке, чтобы просматривать изображения, открывать файлы и папки или удалять лишние снимки. В Minecraft они обычно создаются клавишей F2.
Gallery	Галерея
Open folder	Открыть папку
Settings & performance	Настройки и производительность
Choose RU or EN, memory and display defaults, window and tray behavior, and lighter visuals. First-run hardware recommendations can be recalculated later. Discord Rich Presence is optional.	Выберите RU или EN, параметры памяти и экрана, поведение окна и системного трея, а также упрощённые эффекты. Рекомендации для устройства можно пересчитать позже. Discord Rich Presence включается по желанию.
Memory	Память
Display	Экран
Launcher updates	Обновления лаунчера
Checks GitHub Releases on startup or from Settings. An update can be offered when a newer release includes a suitable package and verifiable SHA-256 checksum; GitHub access is required.	Проверяет GitHub Releases при запуске или из Настроек. Обновление предлагается, если новый выпуск содержит подходящий пакет с проверяемой суммой SHA-256. Нужен доступ к GitHub.
Restart	Перезапуск
Play & process	Игра и процесс
Play shows the selected build, loader, profile, mod count and last launch. Spectral prepares libraries and native files, starts Minecraft as a separate process and records playtime when it ends normally.	Вкладка «Играть» показывает сборку, загрузчик, профиль, число модов и последний запуск. Spectral готовит библиотеки и нативные файлы, запускает Minecraft отдельным процессом и записывает время игры после нормального завершения.
Launch stages	Этапы запуска
main launcher tabs	основных вкладок лаунчера
build types in the wizard	типа сборок в мастере
interface languages	языка интерфейса
local-first design	локальное хранение
First launch	Первый запуск
From install to your first world	От установки до первого мира
Choose a profile, create a build and launch Minecraft: Java Edition.	Выберите профиль, создайте сборку и запустите Minecraft: Java Edition.
Set up Spectral	Настройте Spectral
Open the launcher and use its first-run performance recommendation, or adjust settings yourself.	Откройте лаунчер и примите рекомендованные настройки производительности либо настройте их сами.
Choose a game profile	Выберите игровой профиль
In Accounts, create an offline profile or authorize Ely.by. Sign in to Spectral separately for friends and profile sync.	Во вкладке «Аккаунты» создайте автономный профиль или авторизуйтесь через Ely.by. Для друзей и синхронизации профилей отдельно войдите в Spectral.
Create a build	Создайте сборку
In Library, choose New build, then Vanilla, Fabric or Forge and a Minecraft version. The wizard can install missing version files.	В Библиотеке нажмите «Новая сборка», выберите Vanilla, Fabric или Forge и версию Minecraft. Мастер сможет установить недостающие файлы версии.
Add content and play	Добавьте контент и играйте
Add compatible mods, resource packs or shaders if you want them, set memory and window options, then select the build on Play.	При желании добавьте совместимые моды, наборы ресурсов и шейдеры, настройте память и окно, затем выберите сборку на вкладке «Играть».
Already have a Modrinth pack? Import it from the catalog or a .mrpack file. If launch stops, open Console and run Check & Repair from Play. Version availability depends on the source; back up a build's saves before deleting it.	Уже есть сборка Modrinth? Импортируйте её из каталога или файла .mrpack. При сбое откройте Консоль и запустите «Проверить и исправить» на вкладке «Играть». Доступность версий зависит от источника; перед удалением сборки создайте копию миров.
Spectral Help Center	Справка Spectral
Find the issue.	Найдите причину.
Get back in game.	Возвращайтесь в игру.
Search a guide or choose a symptom below. If you still need help, prepare a note with your version and error details.	Найдите руководство или выберите проблему ниже. Если помощь всё ещё нужна, подготовьте сообщение с версией и подробностями ошибки.
Search Java, memory, mods, accounts...	Поиск: Java, память, моды, аккаунты...
Search across 7 guides and 4 guided checks	Поиск по 7 руководствам и 4 сценариям проверки
Live help and community chat	Помощь и общение с сообществом
Browse the public issue history	Просмотр открытых обращений
Guided checks	Пошаговые проверки
What went wrong?	Что случилось?
Select a symptom and work through its checks.	Выберите проблему и выполните проверки.
Checklist progress	Ход проверки
Choose a symptom	Выберите проблему
01 / Startup	01 / Запуск
Game crashes or freezes	Игра закрывается или зависает
02 / Modded	02 / Моды
Fabric or Forge fails	Fabric или Forge не запускается
03 / In game	03 / В игре
Low FPS or stutter	Низкий FPS или подёргивания
04 / Identity	04 / Аккаунт
Account or offline play	Аккаунт или автономная игра
STARTUP / CRASH	ЗАПУСК / СБОЙ
Find where the launch stopped.	Найдите этап сбоя.
Read the Console and use Check & Repair on the Play tab to inspect the selected build's version files, Java, libraries and assets without starting Minecraft.	Прочитайте Консоль и используйте «Проверить и исправить» во вкладке «Играть», чтобы проверить файлы версии, Java, библиотеки и ресурсы без запуска Minecraft.
Open Console and read the final relevant error.	Откройте Консоль и найдите последнюю важную ошибку.
Run Check & Repair and copy its report.	Запустите «Проверить и исправить» и скопируйте отчёт.
Confirm Java compatibility and leave RAM for the system.	Проверьте совместимость Java и оставьте системе достаточно памяти.
Read the Console guide	Открыть руководство по Консоли
Reset checks	Сбросить проверки
MODDED / LOADER	МОДЫ / ЗАГРУЗЧИК
Check the version chain.	Проверьте версии компонентов.
Fabric and Forge builds need a compatible Minecraft base, Java and mods. A .mrpack import can also use Quilt; NeoForge packs are unsupported.	Для сборок Fabric и Forge нужны совместимые версии Minecraft, Java и модов. Импорт .mrpack может использовать Quilt; NeoForge не поддерживается.
Match the loader build and mods to the Minecraft version.	Сопоставьте версии загрузчика и модов с версией Minecraft.
Check Java's required major version.	Проверьте требуемую основную версию Java.
Use Check & Repair before changing the build's files.	Перед изменением файлов сборки запустите «Проверить и исправить».
Read the modded guide	Открыть руководство по модам
PERFORMANCE	ПРОИЗВОДИТЕЛЬНОСТЬ
Change one variable at a time.	Меняйте по одному параметру.
Compare FPS in the same world and location so you can see which adjustment helped.	Сравнивайте FPS в одном мире и месте, чтобы понять, какое изменение помогло.
Lower render distance and restart the game.	Уменьшите дальность прорисовки и перезапустите игру.
Use a compatible optimization mod for your loader.	Используйте мод оптимизации, совместимый с вашим загрузчиком.
Set reasonable memory without assigning all system RAM.	Выделите разумный объём памяти, не отдавая игре всю оперативную память.
Read the FPS guide	Открыть руководство по FPS
ACCOUNT / OFFLINE	АККАУНТ / АВТОНОМНО
Check which identity you are using.	Проверьте выбранный профиль.
Your Spectral site account syncs profile details and friends. The game uses a selected offline profile or a separately authorized Ely.by session.	Аккаунт сайта Spectral синхронизирует данные профилей и друзей. Для игры используется автономный профиль или отдельно авторизованный сеанс Ely.by.
Select the intended game profile in the launcher.	Выберите нужный игровой профиль в лаунчере.
For Ely.by, sign in on this computer; a saved site profile has no game token.	Для Ely.by войдите на этом компьютере: сохранённый профиль сайта не содержит игровой токен.
For offline play, confirm the server allows offline profiles.	Для автономной игры убедитесь, что сервер допускает такие профили.
Read the account guide	Открыть руководство по аккаунтам
No guided path matches that search.	Проверка по запросу не найдена.
Try a shorter term or browse the guides below.	Сократите запрос или просмотрите руководства ниже.
Still stuck? Prepare a support note with the details you found.	Проблема осталась? Подготовьте сообщение для поддержки с найденными подробностями.
Build a support note	Составить обращение
Before you ask for help	Перед обращением за помощью
Build a useful support note.	Составьте полезное обращение.
A clear version and the final error line help others reproduce the problem. Fill in what you know, then copy a note for Discord, email or an issue.	Версия и последняя строка ошибки помогут другим воспроизвести проблему. Заполните известные данные и скопируйте сообщение для Discord, почты или GitHub Issues.
What happened?	Что произошло?
Something else	Другое
Minecraft version	Версия Minecraft
For example, 1.21.1	Например, 1.21.1
Java version, if relevant	Версия Java, если важно
For example, Java 21	Например, Java 21
Final Console error or what you observed	Последняя ошибка Консоли или ваши наблюдения
Paste a short, relevant excerpt. Remove account details or tokens first.	Вставьте короткий фрагмент. Сначала удалите данные аккаунта и токены.
Copy support note	Скопировать обращение
Clear fields	Очистить поля
Support note preview	Предпросмотр обращения
Your note	Ваше сообщение
Live preview	Предпросмотр
Check the note for personal information before sharing it.	Проверьте сообщение на наличие личных данных перед отправкой.
Knowledge base	База знаний
Answers without the guesswork.	Ответы без догадок.
Filter by topic or search for a specific issue.	Выберите тему или найдите конкретную проблему.
Filter guides by topic	Фильтр руководств по темам
All guides	Все руководства
Launch	Запуск
All questions	Все вопросы
7 guides	7 руководств
Accounts · 2 min	Аккаунты · 2 мин
How do I add a game profile?	Как добавить игровой профиль?
In the desktop launcher, open	В лаунчере откройте
to create an offline profile or sign in through Ely.by. The website can save profile metadata, but Ely.by must be authorized separately on this computer. Microsoft sign-in is currently disabled in the launcher.	чтобы создать автономный профиль или войти через Ely.by. Сайт может сохранять данные профиля, но Ely.by нужно отдельно авторизовать на этом компьютере. Вход через Microsoft пока отключён в лаунчере.
Identity · 1 min	Профили · 1 мин
What's the difference between a site account and a game profile?	Чем аккаунт сайта отличается от игрового профиля?
A	Аккаунт
Spectral site account	сайта Spectral
syncs game profile metadata and gives access to friends and role-based profile slots. A	синхронизирует данные игровых профилей и даёт доступ к друзьям и слотам роли. А
game profile	игровой профиль
supplies the identity selected for launch. A site record alone does not provide an Ely.by game token.	задаёт имя, используемое при запуске. Одной записи на сайте недостаточно для игрового токена Ely.by.
Mods · 3 min	Моды · 3 мин
Why does my Fabric/Forge build fail to start?	Почему сборка Fabric/Forge не запускается?
Check that the Minecraft version, loader, Java and mods are compatible. On Play, run	Убедитесь, что версии Minecraft, загрузчика, Java и модов совместимы. На вкладке «Играть» запустите
and restore supported version files if recommended. Then read the Console error. The check is not meant to remove worlds or user mods.	и при необходимости восстановите поддерживаемые файлы версии. Затем изучите ошибку в Консоли. Проверка не должна удалять миры и пользовательские моды.
Memory · 2 min	Память · 2 мин
How much memory should I allocate?	Сколько памяти выделить?
Use 2–4 GB for vanilla, 4–6 GB for medium modpacks and up to 8 GB for heavy packs. Leave enough memory for your operating system instead of assigning nearly all system RAM.	Для Vanilla используйте 2–4 ГБ, для средних сборок 4–6 ГБ, для больших — до 8 ГБ. Оставьте достаточно памяти операционной системе.
Diagnostics · 2 min	Диагностика · 2 мин
Where can I see logs and errors?	Где посмотреть журналы и ошибки?
The Console tab shows launch stages and Minecraft output with colored levels, timestamps, search, copy and export. The crash analyzer can suggest a likely cause from process output, crash reports or hs_err_pid files; its advice is not an automatic fix.	Консоль показывает этапы запуска и вывод Minecraft с цветными уровнями, временем событий, поиском, копированием и экспортом. Анализатор сбоев может предположить причину по выводу процесса, отчётам или файлам hs_err_pid; его совет не исправляет проблему автоматически.
Offline play · 1 min	Автономная игра · 1 мин
Can I use an offline profile?	Можно ли играть с автономным профилем?
Yes. Installed builds and offline profiles live on this computer. An offline profile works for local play and servers that allow it; it cannot pass official license checks. Installing versions, mods or Java and signing in to online services require access to their sources.	Да. Установленные сборки и автономные профили хранятся на этом компьютере. Автономный профиль подходит для локальной игры и серверов, которые его допускают; официальную проверку лицензии он не проходит. Для установки версий, модов и Java, а также входа в онлайн-сервисы нужен доступ к их источникам.
Performance · 3 min	Производительность · 3 мин
How can I improve low FPS?	Как повысить FPS?
Start with Sodium on Fabric or another compatible optimization stack. Keep render distance reasonable, avoid excessive memory allocation and compare changes in the same world and location.	Начните с Sodium на Fabric или другого совместимого набора оптимизации. Не ставьте слишком большую дальность прорисовки и не выделяйте лишнюю память; сравнивайте изменения в одном мире и месте.
No matching guide yet	Подходящее руководство не найдено
Try a shorter term such as Java, memory, mods or account.	Попробуйте короткий запрос: Java, память, моды или аккаунт.
Ideas & Suggestions	Идеи и предложения
Share your ideas for the launcher and site — the best ones become real features	Поделитесь идеями для лаунчера и сайта — лучшие из них станут новыми возможностями
Share Idea	Предложить идею
Sign in to share an idea	Войдите, чтобы предложить идею
No ideas yet — be the first!	Идей пока нет — станьте первым!
Independent desktop launcher	Независимый лаунчер для компьютера
© 2026 Spectral Launcher — Not affiliated with Mojang or Microsoft	© 2026 Spectral Launcher — не связан с Mojang или Microsoft
`);

window.SpectralI18n.addCatalog(String.raw`
Spectral account	Аккаунт Spectral
Close account panel	Закрыть панель аккаунта
Site Account	Аккаунт сайта
Sign in to manage your Minecraft profiles and access community features	Войдите, чтобы управлять профилями Minecraft и пользоваться возможностями сообщества
Local demo mode: account data stays in this browser. Do not reuse a password from another service.	Локальный деморежим: данные аккаунта остаются в этом браузере. Не используйте пароль от другого сервиса.
Continue with Google	Продолжить через Google
Used Google before? Sign in here, even if your profile has a username.	Ранее использовали Google? Войдите здесь, даже если у профиля есть имя пользователя.
or	или
Email or username	Почта или имя пользователя
Password	Пароль
Forgot password?	Забыли пароль?
No account?	Нет аккаунта?
Create one	Создать
Create Account	Создать аккаунт
Choose a username and password. Email is optional.	Выберите имя пользователя и пароль. Почта необязательна.
Your starting role: Veteran	Ваша начальная роль: Veteran
Assigned automatically to accounts created before May 1, 2027. No selection or payment needed.	Автоматически назначается аккаунтам, созданным до 1 мая 2027 года. Ничего выбирать и оплачивать не нужно.
How do other roles work?	Как работают другие роли?
Veteran is your permanent starting reward. You can explore Pro, Legend and Spectral from your account after signing up. Staff roles are assigned by the team.	Veteran — постоянная награда при регистрации. После создания аккаунта вы сможете узнать о ролях Pro, Legend и Spectral. Служебные роли назначает команда.
Sign up with Google	Зарегистрироваться через Google
Username (3–20 chars)	Имя пользователя (3–20 символов)
Email saved only on this device	Почта хранится только на этом устройстве
Without configured cloud authentication, this creates a device-local demo account only.	Без настроенной облачной авторизации будет создан только локальный демоаккаунт на этом устройстве.
Use at least 10 characters and do not reuse another account password.	Используйте не менее 10 символов и не повторяйте пароль от другого аккаунта.
Confirm Password	Подтвердите пароль
Already registered?	Уже зарегистрированы?
Set a new password	Установить новый пароль
Enter a new password for your account	Введите новый пароль для аккаунта
New password	Новый пароль
Confirm new password	Подтвердите новый пароль
Update password	Обновить пароль
Account workspace	Пространство аккаунта
SPECTRAL / ACCOUNT	SPECTRAL / АККАУНТ
Your space	Ваше пространство
Everything about your identity in one place	Все сведения о вашем профиле в одном месте
Player	Игрок
Account	Аккаунт
Account menu	Меню аккаунта
WORKSPACE	ПРОСТРАНСТВО
Profile	Профиль
Identity & settings	Профиль и настройки
Roles	Роли
Plans & perks	Планы и преимущества
Admin	Администрирование
People & activity	Люди и активность
Local demo	Локальное демо
Changes to your profile are saved when you press Save.	Изменения профиля сохраняются после нажатия «Сохранить».
Core collection	Основная коллекция
Customize	Настроить
Upload avatar	Загрузить аватар
Online identity	Сетевой профиль
Username	Имя пользователя
USER	ПОЛЬЗОВАТЕЛЬ
Profile signal	Стиль профиля
Soft reveal	Плавное появление
1 header unlocked	Открыт 1 фон профиля
Your access	Ваш доступ
Player role	Роль игрока
Explore role perks and profile styles	Изучите преимущества ролей и стили профиля
View roles	Посмотреть роли
Identity studio	Студия профиля
Animated profile headers	Анимированные фоны профиля
Choose a role-powered scene and the way your account menu appears.	Выберите фон, доступный для вашей роли, и анимацию появления меню аккаунта.
Close identity studio	Закрыть студию профиля
Menu entrance	Появление меню
Soft signal	Мягкий сигнал
Appearance & performance	Вид и производительность
Device preferences are saved locally in this browser.	Настройки устройства сохраняются локально в этом браузере.
Light theme	Светлая тема
Dark palette is active	Активна тёмная палитра
Lightweight mode	Облегчённый режим
Full visual quality	Полное качество эффектов
Reduces motion, blur, particles and decorative rendering. The page reloads once when this setting changes.	Уменьшает анимацию, размытие, частицы и декоративные эффекты. После изменения страница один раз перезагрузится.
YOUR PUBLIC IDENTITY	ВАШ ПУБЛИЧНЫЙ ПРОФИЛЬ
Make yourself known	Расскажите о себе
Your display name, status and bio appear on your profile.	Отображаемое имя, статус и описание видны в вашем профиле.
Profile preview	Предпросмотр профиля
LIVE PREVIEW	ПРЕДПРОСМОТР
Your name	Ваше имя
Your status appears here	Здесь появится ваш статус
Display name	Отображаемое имя
What are you working on?	Над чем вы работаете?
Quick status ideas	Примеры статуса
Exploring new worlds	Исследую новые миры
Building something new	Строю что-то новое
Ready to play	Готов играть
About you	О себе
A little about your Minecraft world…	Немного о вашем мире Minecraft…
Change photo	Сменить фото
Reset photo	Сбросить фото
PNG, JPEG or WebP · up to 1 MB. Cloud photos are sent to an automated moderation service before publication.	PNG, JPEG или WebP · до 1 МБ. Облачные фото проходят автоматическую проверку перед публикацией.
All changes saved	Все изменения сохранены
Discard	Отменить
Save profile	Сохранить профиль
SESSION & DATA	СЕАНС И ДАННЫЕ
Your account, explained	Ваш аккаунт
Export my data	Экспортировать мои данные
Send password reset	Отправить ссылку для сброса пароля
Logout	Выйти
Spectral roles	Роли Spectral
Make your account	Сделайте аккаунт
unmistakable.	узнаваемым.
Unlock more launcher profiles, rare identity effects and a badge that follows you across the community.	Откройте больше профилей лаунчера, редкие эффекты оформления и значок, который виден всему сообществу.
Current role	Текущая роль
Standard access	Стандартный доступ
Your current limits	Ваши текущие лимиты
Choose your signal	Выберите свой стиль
Role collection	Коллекция ролей
Billing period	Период оплаты
Monthly	Ежемесячно
Yearly	Ежегодно
COMPARE THE DETAILS	ПОДРОБНОЕ СРАВНЕНИЕ
Find your fit	Найдите подходящую роль
Compare capacity, appearance and staff permissions separately.	Сравните лимиты, оформление и служебные права отдельно.
Compare role features	Сравнить возможности ролей
Capacity	Лимиты
Appearance	Оформление
Permissions	Права
Role comparison, scroll horizontally on small screens	Сравнение ролей; на маленьком экране прокручивайте по горизонтали
Saving a launch choice does not activate a role. Staff roles are assigned by authorized administrators.	Сохранение выбора на запуске не активирует роль. Служебные роли назначают уполномоченные администраторы.
Close checkout	Закрыть оформление
Local launch choice	Локальный выбор
Reserve Pro	Выбрать Pro
Your choice will be saved for the payment launch. No payment is taken now.	Ваш выбор сохранится до запуска оплаты. Сейчас деньги не списываются.
Saved in this browser. No email is sent and no subscription starts.	Выбор сохранён в браузере. Письмо не отправляется, подписка не начинается.
Yearly plan	Годовой план
No charge today	Сегодня без оплаты
Save launch choice	Сохранить выбор
Administration	Администрирование
Control center	Центр управления
Review accounts, understand access and track every local management change.	Проверяйте аккаунты, управляйте доступом и отслеживайте локальные изменения.
Moderator access	Доступ модератора
Local mode	Локальный режим
Administration overview	Обзор администрирования
Users	Пользователи
Active 7d	Активны за 7 дней
Pending	Ожидает
Banned	Заблокированы
Accounts & access	Аккаунты и доступ
Forum	Форум
Community queue	Очередь сообщества
Activity	Активность
Change history	История изменений
Analytics	Аналитика
Usage overview	Обзор использования
REVIEW BEFORE APPLYING	ПРОВЕРЬТЕ ПЕРЕД СОХРАНЕНИЕМ
Review change	Проверить изменение
Reason for this change	Причина изменения
Add context for the activity log	Добавьте пояснение для журнала действий
Cancel	Отмена
Apply change	Применить изменение
CHANGE HISTORY	ИСТОРИЯ ИЗМЕНЕНИЙ
Activity log	Журнал действий
Role and access changes, with the actor and reason. Local history is stored on this device.	Изменения ролей и доступа с указанием автора и причины. Локальная история хранится на этом устройстве.
Search name, username or bio...	Поиск по имени или описанию...
Filter by role	Фильтр по роли
All roles	Все роли
Developer	Разработчик
Moderator	Модератор
Legend	Легенда
Pro	Про
Veteran	Ветеран
Filter by status	Фильтр по статусу
All statuses	Все статусы
Online now	Сейчас в сети
Active this week	Активны на этой неделе
Inactive 30d+	Неактивны более 30 дней
Sort users	Сортировка пользователей
Highest role	По старшей роли
Recently active	По последней активности
Newest users	Сначала новые
Most time	По времени
Name A–Z	По имени А–Я
Select visible	Выбрать видимые
0 users	0 пользователей
0 selected	0 выбрано
Bulk actions only affect manageable users	Массовые действия применяются только к доступным пользователям
Bulk role	Массовое назначение роли
Choose role...	Выберите роль...
Apply role	Назначить роль
Ban	Заблокировать
Unban	Разблокировать
Export	Экспорт
Clear selection	Очистить выбор
User pages	Страницы пользователей
Select a user	Выберите пользователя
Open any account to inspect its activity, identities and access level.	Откройте аккаунт, чтобы проверить активность, профили и уровень доступа.
Community moderation	Модерация сообщества
Idea review queue	Очередь идей
Approve useful suggestions, reject unsuitable posts or restore them later.	Одобряйте полезные предложения, отклоняйте неподходящие записи или восстанавливайте их позже.
0 ideas	0 идей
Search ideas or authors...	Поиск по идеям и авторам...
Filter ideas	Фильтр идей
Approved	Одобрено
Rejected	Отклонено
Live overview	Текущий обзор
Site analytics	Аналитика сайта
Accounts, engagement, Minecraft profiles and community activity.	Аккаунты, вовлечённость, профили Minecraft и активность сообщества.
Refresh	Обновить
Close	Закрыть
Account created	Аккаунт создан
Welcome to Spectral,	Добро пожаловать в Spectral,
Your identity is ready. We also found something special for you.	Ваш профиль готов. Мы приготовили для вас особый подарок.
Your starting role	Ваша начальная роль
Unlocked forever for joining before May 2027	Получена навсегда за регистрацию до мая 2027 года
Enter my account	Перейти в аккаунт
Explore roles	Посмотреть роли
Friend profile	Профиль друга
Close friend profile	Закрыть профиль друга
Delete?	Удалить?
This action is permanent.	Это действие нельзя отменить.
Delete	Удалить
Close editor	Закрыть редактор
New release	Новый выпуск
Update editor	Редактор обновлений
Compose, preview and publish without leaving the page.	Создавайте, просматривайте и публикуйте, не покидая страницу.
Release title	Заголовок выпуска
Library & Mod Manager refresh	Обновление Библиотеки и менеджера модов
Version	Версия
Date	Дата
Jun 27, 2026	27 июня 2026 г.
Channel	Канал
Beta	Бета
Website	Сайт
Release icon	Значок выпуска
Bolt	Молния
SpectrAI	SpectrAI
Interface	Интерфейс
Launcher core	Ядро лаунчера
Security	Безопасность
Short summary	Краткое описание
A short overview shown before the full changelog.	Краткий обзор перед полным списком изменений.
Mark as current release	Сделать текущим выпуском
Highlights this update at the top of the timeline.	Показывает это обновление вверху хронологии.
Changelog	Список изменений
1 item	1 пункт
Add changelog item	Добавить пункт изменений
Feature	Возможность
Improvement	Улучшение
Fix	Исправление
Change type	Тип изменения
+ Added	+ Добавлено
↑ Improved	↑ Улучшено
✧ Fixed	✧ Исправлено
Describe the change...	Опишите изменение...
Changelog item	Пункт изменений
Remove	Удалить
Remove changelog item	Удалить пункт изменений
Save draft	Сохранить черновик
Copy Markdown	Скопировать Markdown
Clear	Очистить
Changes saved locally	Изменения сохранены локально
Publish Update	Опубликовать обновление
Close idea form	Закрыть форму идеи
Share Your Idea	Предложить идею
Cloud ideas are checked automatically before publication. Unsafe text is rejected.	Идеи в облаке автоматически проверяются перед публикацией. Небезопасный текст отклоняется.
Idea title (max 80 chars)	Название идеи (до 80 символов)
Description (max 500 chars)	Описание (до 500 символов)
Describe your idea in detail...	Подробно опишите вашу идею...
Submit Idea	Отправить идею
Scroll to top	Прокрутить наверх
Sign in to see	Войдите, чтобы увидеть
Performance	Производительность
Check & Repair	Проверить и исправить
Core	Ядро
Signals	Сигналы
UI	Интерфейс
your friends here.	здесь ваших друзей.
`);

// Seeded release history is rendered after load; keeping it here also makes
// language changes apply to already expanded timeline entries.
window.SpectralI18n.addCatalog(String.raw`
stable	стабильная
website	сайт
beta	бета
CURRENT	ТЕКУЩАЯ
Copy release as Markdown	Скопировать выпуск в Markdown
Sign in or open account panel	Войти или открыть панель аккаунта
Mark as current	Сделать текущим
Mark as current release	Сделать текущим выпуском
Edit update	Изменить обновление
Duplicate update	Создать копию обновления
Delete update	Удалить обновление
Copy as Markdown	Скопировать в Markdown
Untitled release	Выпуск без названия
Release notes and product changes.	Заметки о выпуске и изменения продукта.
Release notes are ready.	Заметки о выпуске готовы.
Latest release	Последний выпуск
Release	Выпуск
Add at least one changelog item.	Добавьте хотя бы один пункт изменений.
Release copied as Markdown	Выпуск скопирован в Markdown
Update deleted	Обновление удалено
View details	Показать подробности
Hide details	Скрыть подробности
Check, Restore & Understand Crashes	Проверка, восстановление и разбор сбоев
The Play tab now gives a clearer path from a failed launch to a file check, a copyable report and a likely cause.	Вкладка «Играть» помогает пройти путь от неудачного запуска до проверки файлов, отчёта и вероятной причины сбоя.
Check & Repair inspects the selected build’s version files, Java, libraries and assets without launching the game	«Проверить и исправить» проверяет файлы версии, Java, библиотеки и ресурсы выбранной сборки без запуска игры
When a supported Vanilla, Fabric, Forge or Quilt version needs repair, the launcher can restore files and repeat the check	Если поддерживаемой версии Vanilla, Fabric, Forge или Quilt нужно восстановление, лаунчер восстановит файлы и повторит проверку
Crash analysis combines process output, crash reports and hs_err_pid files to suggest likely causes and next steps	Анализ сбоев объединяет вывод процесса, отчёты и файлы hs_err_pid, чтобы подсказать причины и дальнейшие действия
Diagnostic reports can be copied for support while worlds and personal mods stay in their build folders	Отчёт диагностики можно скопировать для поддержки; миры и личные моды остаются в папках сборки
A Clearer Home for Profiles & Friends	Удобное место для профилей и друзей
The site brings game profile details, role-based slots and the friend network into one account workspace.	Сайт объединяет данные игровых профилей, слоты ролей и друзей в одном пространстве аккаунта.
The account page makes the selected game profile, UUID and available profile slots easier to inspect	На странице аккаунта проще просмотреть выбранный игровой профиль, UUID и доступные слоты
Friend requests, player search and profile links are grouped around the signed-in Spectral account	Запросы в друзья, поиск игроков и ссылки на профили собраны в аккаунте Spectral
Profile copy explains that Ely.by authorization remains on the computer running the launcher	Описание профиля объясняет, что авторизация Ely.by остаётся на компьютере с лаунчером
Updates with a Verifiable Package	Обновления с проверяемым пакетом
Launcher updates now explain what changed and require a suitable package with a matching SHA-256 checksum.	Обновления лаунчера теперь показывают изменения и требуют подходящий пакет с совпадающей суммой SHA-256.
Spectral checks GitHub Releases at startup and offers a manual check under Settings → General → About	Spectral проверяет GitHub Releases при запуске; ручная проверка доступна в «Настройки → Общие → О программе»
Available updates show release notes before installation and offer a restart afterward	Перед установкой доступны заметки о выпуске, после неё предлагается перезапуск
An update is offered only when a newer release has a compatible package and a verifiable SHA-256 checksum	Обновление предлагается только при наличии совместимого пакета с проверяемой суммой SHA-256
More Control over Modrinth Content	Больше контроля над контентом Modrinth
Mod discovery and updates stay tied to the build’s Minecraft version and loader instead of treating every file as interchangeable.	Поиск и обновление модов учитывают версию Minecraft и загрузчик сборки, а не считают все файлы взаимозаменяемыми.
Discover compatible mods, resource packs and shaders from inside a build’s Content view	Находите совместимые моды, наборы ресурсов и шейдеры в разделе контента сборки
Required dependencies can be offered during installation; Auto-libraries can download missing ones automatically	Необходимые зависимости предлагаются при установке; «Автобиблиотеки» могут загружать недостающие файлы автоматически
Mod update checks retain disabled state, show update history and can be enabled separately for each build	Проверка обновлений модов сохраняет их отключённое состояние, показывает историю и включается отдельно для каждой сборки
Local files without a matching Modrinth project or compatible release remain under the player’s control	Локальные файлы без соответствующего проекта или совместимого выпуска на Modrinth остаются под контролем игрока
From Modrinth Pack to New Build	Из сборки Modrinth в новую установку
A Modrinth search result or .mrpack file can set up a separate build with its required game version and configuration.	Результат поиска Modrinth или файл .mrpack может создать отдельную сборку с нужной версией игры и настройками.
Search for a pack on Modrinth or choose a local .mrpack file during build creation	При создании сборки найдите пакет на Modrinth или выберите локальный файл .mrpack
The installer reads the pack’s Minecraft version and supports no loader, Fabric, Forge and Quilt packs	Установщик считывает версию Minecraft из пакета и поддерживает сборки без загрузчика, а также Fabric, Forge и Quilt
NeoForge .mrpack files are not accepted by the current installer	Текущий установщик не принимает файлы .mrpack для NeoForge
A Gentler First Run	Более простой первый запуск
Spectral helps new players choose sensible performance defaults, with room to tune them later.	Spectral предлагает новичкам разумные настройки производительности, которые позже можно изменить.
A local first-run check considers available memory, processor, storage and screen before suggesting a performance profile	Локальная проверка при первом запуске учитывает память, процессор, накопитель и экран перед выбором профиля производительности
Settings can recalculate recommendations and adjust memory, resolution, fullscreen mode and JVM arguments	В Настройках можно пересчитать рекомендации и изменить память, разрешение, полноэкранный режим и аргументы JVM
Lower-motion visuals, reduced background effects and interface refresh limits help on weaker computers	Меньше анимации, фоновых эффектов и обновлений интерфейса помогают на слабых компьютерах
Help Center with a Path Forward	Справка с понятным планом действий
Guided checks and a copyable support note make it easier to explain a launch problem clearly.	Пошаговые проверки и обращение для копирования помогают понятно описать проблему с запуском.
Choose a startup, modded, performance or account symptom to see focused checks	Выберите проблему запуска, модов, производительности или аккаунта для точных проверок
Build a support note with Minecraft version, Java version and the final relevant Console error	Составьте обращение с версией Minecraft и Java и последней важной ошибкой Консоли
Searchable answers link site account details, game profiles, offline play and launcher diagnostics	Ответы с поиском связывают сведения об аккаунте сайта, игровых профилях, автономной игре и диагностике лаунчера
A Library for Every Kind of World	Библиотека для любого мира
Separate build folders make experimenting with loaders and mods less disruptive to existing worlds.	Отдельные папки сборок позволяют экспериментировать с загрузчиками и модами без риска для других миров.
Create, rename, configure and copy builds with their own mods, settings, worlds and screenshots	Создавайте, переименовывайте, настраивайте и копируйте сборки с отдельными модами, настройками, мирами и скриншотами
The last selected build is restored when the launcher opens again	Последняя выбранная сборка восстанавливается при следующем открытии лаунчера
A screenshot gallery can preview, open and remove images from each build	Галерея позволяет просматривать, открывать и удалять скриншоты каждой сборки
Deleting a build requires confirmation because its local files, including saves, are removed	Удаление сборки требует подтверждения, поскольку вместе с ней удаляются локальные файлы, включая миры
The Right Java for the Right Version	Подходящая Java для каждой версии
Spectral matches Java to the selected Minecraft release and can fetch a suitable runtime when one is missing.	Spectral подбирает Java для выбранной версии Minecraft и может загрузить подходящую среду, если её нет.
Installed and previously downloaded Java runtimes are scanned and checked for compatibility	Установленные и ранее загруженные версии Java обнаруживаются и проверяются на совместимость
A suitable runtime can be downloaded automatically when none is available	Подходящая среда может загрузиться автоматически, если её нет на компьютере
Advanced users can set a global custom Java path and JVM arguments; older game versions still use compatibility checks	Опытные пользователи могут задать собственный путь к Java и аргументы JVM; для старых версий игры также проверяется совместимость
Ideas with More Context	Больше информации об идеях
Community proposals became easier to browse and connect to the people behind them.	Предложения сообщества стало проще просматривать и связывать с авторами.
Idea cards make votes and moderation status easier to see	В карточках идей удобнее видеть голоса и статус модерации
Profile and role pages give community contributions a clearer identity	Страницы профилей и ролей делают вклад участников заметнее
Developers can publish update entries from the site editor	Разработчики могут публиковать обновления через редактор сайта
Profiles, Play & a Useful Console	Профили, игра и удобная Консоль
The five-tab desktop launcher ties a selected game profile and build to a visible launch process.	Пять вкладок лаунчера связывают выбранный профиль и сборку с видимым процессом запуска.
Create a local offline profile or authorize Ely.by in Accounts, including its two-factor code	Создайте локальный автономный профиль или авторизуйтесь в Ely.by во вкладке «Аккаунты», включая двухфакторный код
Play shows the selected build, loader, game profile, mod count, playtime and last launch	Вкладка «Играть» показывает сборку, загрузчик, профиль, число модов, время в игре и последний запуск
Console displays launch stages and Minecraft output with search, timestamps, copy and export	Консоль показывает этапы запуска и вывод Minecraft с поиском, временем событий, копированием и экспортом
Mod Manager Redesign	Новый дизайн менеджера модов
A cleaner two-panel mod workflow with faster discovery, clearer actions and a more consistent launcher interface.	Более удобный двухпанельный интерфейс модов с быстрым поиском, понятными действиями и единым стилем лаунчера.
Mod Manager rebuilt to match the Library layout — the mod list sits on the left, with every action grouped in a panel on the right	Менеджер модов теперь похож на Библиотеку: список слева, действия в панели справа
Bigger window and a cleaner header bar with a segmented Installed / Discover switch	Окно стало больше, заголовок проще, а переключатель «Установлено / Каталог» — компактнее
Unified icons and styling across the dialog — removed the icon chip backings and the dark box behind the tabs	Единые иконки и стили во всём окне: убраны подложки значков и тёмный фон вкладок
Website 2.0 — Accounts, Forum & Themes	Сайт 2.0 — аккаунты, форум и темы
The community site now feels like a real product surface with profiles, ideas, themes and developer controls.	Сайт сообщества получил профили, идеи, темы и инструменты разработчиков.
Two-tier accounts: a site account now holds your own set of Minecraft launcher profiles	Два уровня аккаунтов: аккаунт сайта хранит набор ваших профилей лаунчера Minecraft
Community Ideas & Suggestions forum with upvotes and automatic content moderation	Форум идей и предложений с голосованием и автоматической модерацией
Admin panel to manage users, roles and forum posts — developers can publish updates right from the site	Панель администратора для управления пользователями, ролями и записями форума; разработчики могут публиковать обновления прямо на сайте
Brand-new light theme with an animated aurora background and a one-click dark/light toggle	Новая светлая тема с анимированным фоном и переключением тёмной и светлой палитры одним нажатием
Polished login dialog, crisper 100px avatars and dozens of layout and colour fixes	Улучшенное окно входа, чёткие аватары 100 px и множество исправлений раскладки и цветов
Typography & SpectrAI Prototype	Типографика и прототип SpectrAI
New refined fonts across the app — Sora for headings and Plus Jakarta Sans for the interface	Новые шрифты приложения: Sora для заголовков и Plus Jakarta Sans для интерфейса
Experimental SpectrAI panel added in source; it is not advertised as a ready-to-use assistant	В исходный код добавлена экспериментальная панель SpectrAI; она пока не представлена как готовый помощник
Accounts tab rebuilt to match the Library layout — list on the left, detailed profile card on the right	Вкладка «Аккаунты» перестроена по образцу Библиотеки: список слева, подробности профиля справа
Performance & Launch Reliability	Производительность и надёжность запуска
Modded builds now auto-install their required vanilla base, so they actually start	Сборки с модами автоматически устанавливают нужную базовую версию Vanilla и запускаются
Step-by-step console diagnostics that help identify likely launch failures	Пошаговая диагностика в Консоли помогает находить вероятные причины сбоя
Smoother animations: cached particle background and paused effects on hidden tabs	Анимации стали плавнее: фоновые частицы сохраняются, а эффекты скрытых вкладок приостанавливаются
Native libraries are cached after first launch for faster restarts	Нативные библиотеки сохраняются после первого запуска для ускорения следующих
Interface, Console & Localization	Интерфейс, Консоль и локализация
Full RU / EN coverage across every tab and dialog	Полный перевод RU / EN во всех вкладках и диалогах
Redesigned Console with colored log levels, search, copy and export	Обновлённая Консоль с цветными уровнями журнала, поиском, копированием и экспортом
Unified glassmorphism panels, centered titles and consistent controls	Единый стиль полупрозрачных панелей, центрированные заголовки и согласованные элементы управления
Launcher Foundation	Основа лаунчера
Qt 6 / C++17 desktop app built with CMake and MinGW	Приложение Qt 6 / C++17, собранное с CMake и MinGW
Instance library, Java manager, version installer and mod manager	Библиотека сборок, менеджер Java, установщик версий и менеджер модов
Discord Rich Presence, news system, settings and crash/log tooling	Discord Rich Presence, новости, настройки и инструменты для ошибок и журналов
`);

window.SpectralI18n.addCatalog(String.raw`
GUEST	ГОСТЬ
SIGNED IN	ВЫ ВОШЛИ
Sign in to your site account to see your Minecraft profiles	Войдите в аккаунт сайта, чтобы увидеть профили Minecraft
No Minecraft profiles yet	Профилей Minecraft пока нет
No profiles match your filters	Профили по фильтрам не найдены
Time in game	Время в игре
Date added	Дата добавления
Online	В сети
Enter a username to add.	Введите имя пользователя.
Player search is temporarily unavailable.	Поиск игроков временно недоступен.
You can't add yourself.	Нельзя добавить себя.
Remove friend	Удалить друга
Decline	Отклонить
Cancel request	Отменить запрос
View profile	Открыть профиль
Friend request received	Получен запрос в друзья
Friend request sent	Запрос в друзья отправлен
Community profile	Профиль участника
This player has not added a biography yet.	Игрок пока не добавил описание.
In Minecraft	В Minecraft
On site	На сайте
Member since	Участник с
Last seen	Последняя активность
Mutual friends	Общие друзья
Copied!	Скопировано!
Authenticated mode: remote data is limited to your account by Row Level Security.	Авторизованный режим: доступ к удалённым данным вашего аккаунта ограничен политиками безопасности.
Connection unavailable. Reconnect to sign in to your cloud account.	Нет соединения. Подключитесь к сети для входа в облачный аккаунт.
Email address (optional)	Адрес почты (необязательно)
Email saved only on this device (optional)	Почта хранится только на этом устройстве (необязательно)
Leave this blank to create an account with only a username and password. Without email, password recovery is unavailable.	Оставьте поле пустым, чтобы создать аккаунт только с именем и паролем. Без почты восстановить пароль не получится.
Account service unavailable. Try again.	Сервис аккаунтов недоступен. Попробуйте ещё раз.
Account service returned an incomplete session.	Сервис аккаунтов вернул неполные данные сеанса.
Sign-in could not be completed. Try again.	Не удалось завершить вход. Попробуйте ещё раз.
Minecraft player	Игрок Minecraft
This account has been banned	Этот аккаунт заблокирован
Signed out.	Вы вышли из аккаунта.
Sign-out failed. Check your connection and try again.	Не удалось выйти. Проверьте соединение и попробуйте ещё раз.
Account data could not be verified. Please retry.	Не удалось проверить данные аккаунта. Повторите попытку.
Session could not be restored.	Не удалось восстановить сеанс.
Invalid email/username or password	Неверная почта, имя пользователя или пароль
Connection unavailable. Please reconnect.	Нет соединения. Подключитесь к сети.
Incorrect username or password. If you used Google, choose Google sign-in.	Неверное имя или пароль. Если вы использовали Google, выберите вход через Google.
Sign-in is temporarily unavailable. Please try again.	Вход временно недоступен. Попробуйте позже.
Use 3–20 letters, numbers, spaces or _ . - for your username.	Для имени пользователя используйте 3–20 букв, цифр, пробелов или символов _ . -.
Enter a valid email address or leave the field empty.	Введите правильный адрес почты или оставьте поле пустым.
Use a password with 10–128 characters.	Используйте пароль длиной от 10 до 128 символов.
Passwords do not match.	Пароли не совпадают.
Connection unavailable. Reconnect to create your account.	Нет соединения. Подключитесь к сети, чтобы создать аккаунт.
This username or email is already used on this device.	Это имя или адрес почты уже используется на устройстве.
Account could not be created. Check your details and try again.	Не удалось создать аккаунт. Проверьте данные и повторите попытку.
Check your inbox to confirm your email, then sign in.	Проверьте почту, подтвердите адрес и войдите.
This browser cannot save your account. Free some storage and try again.	Браузер не может сохранить аккаунт. Освободите место и попробуйте ещё раз.
Account could not be created. Try again.	Не удалось создать аккаунт. Попробуйте ещё раз.
Google sign-in is unavailable (Supabase not connected).	Вход через Google недоступен (нет подключения к Supabase).
Google sign-in is temporarily unavailable. Please try again.	Вход через Google временно недоступен. Попробуйте позже.
Password recovery needs a real email. For a username-only account, keep your password safe; Google accounts should use Google sign-in.	Для восстановления пароля нужен действующий адрес почты. Если у аккаунта только имя пользователя, берегите пароль; для аккаунта Google используйте вход через Google.
Password recovery needs the site served over http(s), not a file:// page.	Восстановление пароля работает на сайте по HTTP(S), а не при открытии файла напрямую.
Password recovery is unavailable (Supabase not connected).	Восстановление пароля недоступно (нет подключения к Supabase).
If an account exists for that email, a recovery link will arrive shortly.	Если аккаунт с этим адресом существует, скоро придёт ссылка для восстановления.
Password must be at least 10 characters	Пароль должен содержать не менее 10 символов
Passwords do not match	Пароли не совпадают
Recovery is unavailable (Supabase not connected).	Восстановление недоступно (нет подключения к Supabase).
Password updated! Signing you in…	Пароль обновлён! Выполняется вход…
Password update is temporarily unavailable. Please try again.	Обновление пароля временно недоступно. Попробуйте позже.
`);

window.SpectralI18n.addCatalog(String.raw`
Indigo starlight with quiet drifting orbits.	Звёздный свет индиго с плавно движущимися орбитами.
Veteran Archive	Архив ветерана
Founder collection	Коллекция основателей
Layered jade contours and a soft founder glow.	Нефритовые контуры и мягкое свечение основателей.
Solar Flux	Солнечный поток
Pro collection	Коллекция Pro
Warm horizon light across a deep dusk field.	Тёплый свет горизонта на глубоком сумеречном фоне.
Violet Crown	Фиолетовая корона
Legend collection	Коллекция Legend
Violet depth with fine refracted light.	Фиолетовая глубина и тонкие преломления света.
Spectral Prism	Призма Spectral
Signature identity	Фирменный стиль
Cyan, violet and rose light crossing in fine planes.	Пересечение бирюзового, фиолетового и розового света.
Guardian Grid	Сетка хранителя
Staff collection	Служебная коллекция
Cool blue signal lines with a steady glow.	Холодные голубые линии с ровным свечением.
Command Core	Командное ядро
Admin collection	Коллекция администратора
Rose red scanlines over a dark command field.	Розово-красные линии поверх тёмного командного поля.
Developer Protocol	Протокол разработчика
Internal build	Внутренняя сборка
Rose and cyan traces across a quiet developer field.	Розовые и бирюзовые следы на спокойном фоне разработчика.
Aurora rise	Восход сияния
Portal fold	Складка портала
Stardust	Звёздная пыль
Prism rift	Призматический разлом
Terminal boot	Запуск терминала
Animated header	Анимированный фон
Player favorite	Выбор игроков
More room for profiles with a warm gold identity across Spectral.	Больше места для профилей и тёплый золотой стиль во всём Spectral.
Most popular	Самая популярная
A rare violet presence, expanded capacity and earlier community visibility.	Редкое фиолетовое оформление, увеличенные лимиты и заметность в сообществе.
Everything unlocked	Открыто всё
Unlimited identities and the complete prismatic Spectral treatment.	Неограниченное число профилей и полный призматический стиль Spectral.
/ year	/ год
/ month	/ месяц
Cancel whenever payments launch	Можно отменить после запуска оплаты
Developer is viewing	Просмотр разработчика
Preview only · Developer permissions stay active	Только предпросмотр · права разработчика сохраняются
Founder reward · permanent	Награда основателя · навсегда
Viewing this role	Просмотр роли
Reserved for launch	Выбрано к запуску
Assigned automatically	Назначено автоматически
Founder window closed	Период получения роли основателя завершён
Choose role	Выбрать роль
Staff access	Служебный доступ
Account role	Роль аккаунта
Legacy collection	Коллекция ветеранов
Premium collection	Премиальная коллекция
Developer preview	Предпросмотр разработчика
Never sold	Не продаётся
For every account registered before May 1, 2027.	Для всех аккаунтов, зарегистрированных до 1 мая 2027 года.
Yearly plan · indicative launch price	Годовой план · ориентировочная цена при запуске
Monthly plan	Месячный план
Developer role preview restored.	Предпросмотр роли разработчика восстановлен.
Storage is full. Your choice was not saved.	Недостаточно места. Ваш выбор не сохранён.
Your starting Spectral identity	Ваш начальный стиль Spectral
Your identity is ready — and your arrival date unlocked a permanent reward.	Ваш профиль готов, а дата регистрации открыла постоянную награду.
Your identity is ready. Welcome to the Spectral community.	Ваш профиль готов. Добро пожаловать в сообщество Spectral.
The selected file is not a valid image.	Выбранный файл не является изображением.
Choose a PNG, JPEG or WebP image.	Выберите изображение PNG, JPEG или WebP.
Avatar images must be 1 MB or smaller.	Аватар должен быть не больше 1 МБ.
Avatar dimensions must be between 1 and 4096 pixels.	Размеры аватара должны быть от 1 до 4096 пикселей.
This browser cannot process the image.	Браузер не может обработать изображение.
The processed avatar is too large.	Обработанный аватар слишком большой.
Avatar could not be processed.	Не удалось обработать аватар.
Saving your profile…	Сохранение профиля…
Unsaved changes · kept while switching tabs	Несохранённые изменения · сохраняются при переключении вкладок
Avatar awaiting review	Аватар ожидает проверки
Enter a display name.	Введите отображаемое имя.
Reconnect to save your profile. Your draft is still here.	Подключитесь к сети, чтобы сохранить профиль. Черновик останется здесь.
Avatar review queue is unavailable. Apply the moderation migration.	Очередь проверки аватаров недоступна. Примените обновление схемы модерации.
Profile could not be saved online. Please try again.	Не удалось сохранить профиль в сети. Попробуйте ещё раз.
Updated	Обновлено
Pending avatar	Аватар на проверке
Visible avatar	Видимый аватар
No avatar	Нет аватара
Pending review	Ожидает проверки
Account owner edited profile	Владелец изменил профиль
Avatar approved automatically.	Аватар одобрен автоматически.
Avatar was rejected by automatic review.	Аватар отклонён автоматической проверкой.
Avatar is waiting for review. Your current avatar stays visible.	Аватар ожидает проверки. Текущий аватар остаётся видимым.
Profile saved.	Профиль сохранён.
Connected account	Подключённый аккаунт
Local demo account	Локальный демоаккаунт
Your profile uses authenticated cloud access.	Ваш профиль использует авторизованный облачный доступ.
This identity exists in this browser. It is separate from a Minecraft or Microsoft account.	Этот профиль существует в браузере отдельно от аккаунтов Minecraft и Microsoft.
Authenticated	Авторизовано
This device	Это устройство
Unknown	Неизвестно
Email reset link	Ссылка для сброса пароля
Unavailable for local demos	Недоступно для локального демо
Your account export is ready.	Экспорт данных аккаунта готов.
Check your inbox for a password reset link.	Проверьте почту: ссылка для сброса пароля отправлена.
Reset email could not be sent. Try again.	Не удалось отправить письмо для сброса пароля. Попробуйте ещё раз.
Launcher profiles	Профили лаунчера
Favorite profiles	Избранные профили
Above your current limit · remove profiles before adding more	Лимит превышен · удалите профили перед добавлением новых
Staff	Команда
Manage lower roles and community access	Управление младшими ролями и доступом сообщества
Review community ideas	Проверка идей сообщества
Personal profile, friends and launcher identities	Личный профиль, друзья и игровые профили
Launch choice removed.	Выбор к запуску удалён.
Could not remove your choice. Try again.	Не удалось убрать выбор. Попробуйте ещё раз.
Role source	Источник роли
Founder reward	Награда основателя
Planned premium	Планируемая премиальная роль
Default	По умолчанию
Signature header	Фирменный фон
Included	Включено
Entrance	Анимация появления
Community badge	Значок сообщества
Standard identity	Стандартный профиль
Manage own profile	Управлять своим профилем
Review ideas	Проверять идеи
Manage lower roles	Управлять младшими ролями
Developer previews	Предпросмотры разработчика
Access	Доступ
Not included	Не включено
`);

window.SpectralI18n.addCatalog(String.raw`
No reason recorded	Причина не указана
Choose an account and an action first.	Сначала выберите аккаунт и действие.
Your account cannot make this change.	Ваш аккаунт не может выполнить это изменение.
Change role	Изменить роль
Delete local account	Удалить локальный аккаунт
Restrict sign-in	Ограничить вход
Restore sign-in	Восстановить вход
Restricted	Ограничен
Active	Активен
Deleted with local data	Удалён с локальными данными
Add a short reason (at least 3 characters).	Добавьте краткую причину (не менее 3 символов).
Your session changed. Review this action again.	Сеанс изменился. Проверьте действие ещё раз.
Permissions changed. Review the account again.	Права изменились. Проверьте аккаунт ещё раз.
An account changed after your review. Cancel and review the latest state.	Аккаунт изменился после проверки. Отмените действие и изучите новое состояние.
Reconnect to administration before applying changes.	Восстановите соединение с панелью администратора перед применением изменений.
Server rejected the change. Refresh the directory and review your permissions.	Сервер отклонил изменение. Обновите список и проверьте свои права.
Deleted	Удалён
Reviewed changes saved.	Проверенные изменения сохранены.
Could not save the change. Try again.	Не удалось сохранить изменение. Попробуйте ещё раз.
Server administration is unavailable. Install the administration migration to enable roles, bans and activity history.	Управление на сервере недоступно. Примените обновление схемы администрирования для ролей, блокировок и истории действий.
Previous page	Предыдущая страница
Next page	Следующая страница
just now	только что
m ago	мин назад
h ago	ч назад
d ago	дн назад
mo ago	мес назад
Select at least one user	Выберите хотя бы одного пользователя
Cloud accounts: roles and bans are checked and applied by the server. The directory shows up to 250 profiles.	Облачные аккаунты: роли и блокировки проверяются и применяются сервером. В списке отображается до 250 профилей.
Local demo: changes affect accounts in this browser. Role checks here do not secure a remote service.	Локальное демо: изменения затрагивают аккаунты в этом браузере. Проверка ролей здесь не защищает удалённый сервис.
Unnamed	Без имени
Close details	Закрыть подробности
No biography has been added yet.	Описание пока не добавлено.
Not provided	Не указано
User ID copied	ID пользователя скопирован
No bio yet	Описания пока нет
Minecraft identities	Игровые профили Minecraft
Total time on site	Общее время на сайте
Visits	Посещения
Inspect user	Просмотреть пользователя
This account is protected by the role hierarchy.	Этот аккаунт защищён иерархией ролей.
This account is protected.	Этот аккаунт защищён.
Select users to export.	Выберите пользователей для экспорта.
Untitled idea	Идея без названия
No date	Дата не указана
Restore	Восстановить
Approve	Одобрить
Post approved.	Запись одобрена.
Post moved to rejected.	Запись отклонена.
Delete this idea permanently?	Удалить эту идею навсегда?
Site Users	Пользователи сайта
Avg Time / User	Среднее время на пользователя
Minecraft Profiles	Профили Minecraft
Ideas Approved	Одобренные идеи
Total Time on Site	Общее время на сайте
Total Visits	Всего посещений
Active (7 days)	Активны за 7 дней
New This Week	Новые за неделю
Avg MC / User	Среднее игровое время
Ideas Pending	Идеи на проверке
Banned Users	Заблокированные пользователи
Total Ideas	Всего идей
authenticated account only	только для авторизованного аккаунта
none — local demo only	нет — только локальное демо
Account sync failed	Ошибка синхронизации аккаунта
Clear ALL local demo data on this device? Authenticated remote data is not deleted.	Удалить ВСЕ локальные демоданные с этого устройства? Удалённые данные авторизованного аккаунта сохранятся.
Current account limits	Текущие лимиты аккаунта
Role comparison	Сравнение ролей
Close role choice	Закрыть выбор роли
Favorites	Избранное
Full workspace and safe role previews	Полный доступ и безопасный предпросмотр ролей
Manage lower roles and access	Управление младшими ролями и доступом
Review community queue	Проверка очереди сообщества
Manage your own identities	Управление своими профилями
Saved for launch	Сохранено к запуску
Founder role	Роль основателя
Explore plan	Изучить план
ACTIVE	АКТИВНО
SAVED	СОХРАНЕНО
VISUAL PREVIEW	ПРЕДПРОСМОТР
FOUNDER LEGACY	НАСЛЕДИЕ ОСНОВАТЕЛЕЙ
COMMUNITY FAVORITE	ВЫБОР СООБЩЕСТВА
COMPLETE ACCESS	ПОЛНЫЙ ДОСТУП
EVERYDAY UPGRADE	ПОВСЕДНЕВНОЕ УЛУЧШЕНИЕ
Earned forever	Получено навсегда
Founders only	Только для основателей
Indicative monthly price · no charge today	Ориентировочная месячная цена · сегодня без оплаты
Appearance preview · no purchase	Предпросмотр оформления · без покупки
A permanent badge from the founding year	Постоянный значок года основания
Source	Источник
Founder	Основатель
Launch choice	Выбор к запуску
Header	Фон профиля
Badge	Значок
Own profile	Свой профиль
Manage roles	Управлять ролями
Preview only · Developer access stays active	Только предпросмотр · доступ разработчика сохраняется
Unlimited	Без ограничений
per year	за год
per month	за месяц
This browser could not save the choice.	Браузер не смог сохранить выбор.
Saved plan removed.	Сохранённый план удалён.
Admin workspace sections	Разделы панели администратора
Find a person…	Найти человека…
Role filter	Фильтр ролей
Status filter	Фильтр статусов
Search ideas or authors	Поиск по идеям и авторам
Idea status	Статус идеи
Change username	Изменить имя пользователя
Change display name	Изменить отображаемое имя
Approve avatar	Одобрить аватар
Reject avatar	Отклонить аватар
Remove avatar	Удалить аватар
Change password	Изменить пароль
No accounts found	Аккаунты не найдены
Use Refresh data after applying the administration migration.	После обновления схемы администрирования нажмите «Обновить данные».
Clear a filter or try another name.	Сбросьте фильтр или попробуйте другое имя.
New username	Новое имя пользователя
New display name	Новое отображаемое имя
Short reason for the activity log	Краткая причина для журнала действий
Use a password with 12–128 characters.	Используйте пароль длиной от 12 до 128 символов.
The passwords do not match.	Пароли не совпадают.
Use 3–20 letters, numbers, spaces or _ . - for the username.	Для имени пользователя используйте 3–20 букв, цифр, пробелов или символов _ . -.
Use a display name of 1–24 characters.	Для отображаемого имени используйте 1–24 символа.
The pending avatar is no longer available.	Аватар, ожидавший проверки, больше недоступен.
Reconnect to administration.	Восстановите соединение с панелью администратора.
Password change was rejected. Refresh the account and audit history before retrying.	Смена пароля отклонена. Обновите аккаунт и историю действий перед повторной попыткой.
Server rejected the moderation change. Refresh the account and try again.	Сервер отклонил решение модерации. Обновите аккаунт и попробуйте ещё раз.
Unchanged	Без изменений
Changed	Изменено
This username is already taken.	Это имя пользователя уже занято.
Visible	Видно
Removed	Удалено
Reviewed account change saved.	Проверенное изменение аккаунта сохранено.
Add a short reason before applying.	Добавьте краткую причину перед применением.
The idea changed. Refresh the queue.	Идея изменилась. Обновите очередь.
Idea	Идея
Idea review saved.	Решение по идее сохранено.
Could not save the review.	Не удалось сохранить решение.
The account changed. Review the latest state.	Аккаунт изменился. Проверьте новое состояние.
Select one account for this change.	Выберите один аккаунт для этого действия.
Reviewed admin change saved.	Проверенное изменение сохранено.
Browser storage is full.	Хранилище браузера переполнено.
Loaded accounts	Загруженные аккаунты
Syncing…	Синхронизация…
Database connected	База данных подключена
Database disconnected	База данных отключена
Local demo mode	Локальный деморежим
No matching ideas	Идеи не найдены
Refresh after checking the community migration.	Проверьте обновление схемы сообщества и нажмите «Обновить».
Try another filter or search.	Выберите другой фильтр или запрос.
Local data refreshed.	Локальные данные обновлены.
Reject	Отклонить
`);

window.SpectralI18n.addCatalog(String.raw`
Copied to clipboard	Скопировано в буфер обмена
Change type	Тип изменения
Describe the change…	Опишите изменение…
Move up	Переместить вверх
Move item up	Переместить пункт вверх
Move down	Переместить вниз
Move item down	Переместить пункт вниз
Bold	Жирный
Inline code	Код в строке
Link	Ссылка
Release date	Дата выпуска
Draft saved locally	Черновик сохранён локально
Editing release	Редактирование выпуска
Duplicate release	Копия выпуска
Restored local draft	Локальный черновик восстановлен
Save Changes	Сохранить изменения
Draft copied as Markdown	Черновик скопирован в Markdown
Clear every field in this draft?	Очистить все поля черновика?
Add a release title and date	Добавьте заголовок и дату выпуска
Add at least one changelog item	Добавьте хотя бы один пункт изменений
Update saved	Обновление сохранено
Update published locally	Обновление опубликовано локально
No ideas yet. Be the first to share one.	Идей пока нет. Предложите первую!
Could not save your vote.	Не удалось сохранить голос.
Please enter a title	Введите название
Please describe your idea	Опишите идею
Idea published after automatic review.	Идея опубликована после автоматической проверки.
Idea rejected by automatic review.	Идея отклонена автоматической проверкой.
Could not submit the idea.	Не удалось отправить идею.
Idea submitted for moderator review. Thank you!	Идея отправлена на проверку модератору. Спасибо!
`);

window.SpectralI18n.addCatalog(String.raw`
Light palette is active	Активна светлая палитра
Optimized rendering is active	Активна оптимизированная отрисовка
Enabled automatically for this device. Blur, particles and continuous motion are paused.	Включено автоматически для этого устройства. Размытие, частицы и постоянная анимация приостановлены.
Blur, particles and continuous motion are paused. The page reloads once when this setting changes.	Размытие, частицы и постоянная анимация приостановлены. После изменения страница один раз перезагрузится.
Uses the complete visual experience. The page reloads once when this setting changes.	Включает все визуальные эффекты. После изменения страница один раз перезагрузится.
Runtime selection	Выбор среды запуска
Matches the Minecraft version to a compatible Java major and chooses the best installed runtime, with download as an explicit fallback.	Сопоставляет версию Minecraft с совместимой основной версией Java и выбирает лучшую установленную среду; загрузка предлагается отдельно.
MC version → Java major → runtime	Версия Minecraft → версия Java → среда
Derive the required Java major	Определить нужную версию Java
Scan installed runtimes	Найти установленные среды
Return a compatible, deterministic match	Выбрать подходящую среду
Stable player identity	Постоянный игровой профиль
Keeps local profiles predictable by generating the same vanilla-compatible offline UUID for the same Minecraft username.	Создаёт один и тот же совместимый с Vanilla автономный UUID для каждого имени игрока Minecraft.
username → offline UUID → profile	имя игрока → автономный UUID → профиль
Normalize the OfflinePlayer input	Привести имя OfflinePlayer к нужному виду
Apply the UUID v3 bit layout	Применить структуру битов UUID v3
Keep identity stable between launches	Сохранять профиль между запусками
Resolve the game version	Определение версии игры
Version metadata tells the launcher which libraries, assets and inherited settings this instance actually needs.	Данные версии подсказывают лаунчеру, какие библиотеки, ресурсы и унаследованные настройки нужны сборке.
Minecraft version + instance files	Версия Minecraft + файлы сборки
Resolved libraries, assets and metadata	Найденные библиотеки, ресурсы и данные версии
A missing file or mismatched loader often shows up here. Run Check & Repair and restore a supported version if recommended.	Здесь часто обнаруживаются отсутствующие файлы и несовместимый загрузчик. Запустите «Проверить и исправить» и при необходимости восстановите поддерживаемую версию.
Match a compatible Java runtime	Подбор совместимой Java
The required Java major version comes from the selected game build. Spectral looks for a runtime that meets it.	Нужная основная версия Java определяется выбранной сборкой. Spectral ищет подходящую среду.
Required Java major version	Требуемая версия Java
Compatible Java executable	Совместимый исполняемый файл Java
If Java cannot be found, check the version requirement and select or install a matching runtime.	Если Java не найдена, проверьте требуемую версию и выберите или установите подходящую среду.
Assemble the launch command	Подготовка команды запуска
LauncherCore prepares native files, builds the classpath and passes the right game and JVM arguments to the process.	LauncherCore готовит нативные файлы, собирает путь классов и передаёт процессу нужные аргументы игры и JVM.
Resolved files + settings + account	Найденные файлы + настройки + аккаунт
Complete Minecraft command	Готовая команда Minecraft
A missing native or invalid argument should be diagnosed from the exact command stage, not guessed from the game window.	Отсутствующий нативный файл или неверный аргумент следует искать на этапе команды запуска, а не по окну игры.
Observe the running process	Наблюдение за процессом
QProcess streams output and exit state into Console, so a failure remains inspectable after the game closes.	QProcess передаёт вывод и состояние завершения в Консоль, поэтому сбой можно изучить после закрытия игры.
Minecraft JVM process	Процесс Minecraft JVM
Logs, exit code and visible errors	Журналы, код выхода и видимые ошибки
When asking for help, share the final relevant Console lines and the selected Minecraft and Java versions.	При обращении за помощью приложите последние важные строки Консоли и выбранные версии Minecraft и Java.
Coordinates launch preparation, builds the final Minecraft command and owns the QProcess lifecycle exposed to the interface.	Управляет подготовкой запуска, собирает команду Minecraft и контролирует жизненный цикл QProcess в интерфейсе.
Arguments · process state	Аргументы · состояние процесса
UI · Java · version data	Интерфейс · Java · данные версии
Builds the classpath and game arguments	Собирает путь классов и аргументы игры
Prepares native libraries before launch	Готовит нативные библиотеки до запуска
Emits output, state and real failure signals	Передаёт вывод, состояние и реальные сигналы ошибок
Discovers installed Java runtimes and matches them to the major version required by the selected Minecraft metadata.	Находит установленную Java и сопоставляет её с основной версией, требуемой выбранной версией Minecraft.
Discovery · compatibility	Поиск · совместимость
Version metadata · LauncherCore	Данные версии · LauncherCore
Java major	Версия Java
Runtime scan	Поиск среды
Fallback	Резервный вариант
Version JSON	JSON версии
Java path	Путь к Java
Scans available Java installations	Ищет установленные версии Java
Selects by required major version	Выбирает по нужной основной версии
Supports an explicit runtime download path	Поддерживает отдельную загрузку среды
Installs Minecraft versions and manages instance content, including Modrinth discovery, version files and compatible mod updates.	Устанавливает версии Minecraft и управляет содержимым сборок: поиском на Modrinth, файлами версий и обновлениями совместимых модов.
Versions · mods · assets	Версии · моды · ресурсы
Modrinth · instance library	Modrinth · библиотека сборок
Content manager	Менеджер контента
Instance files	Файлы сборки
Resolves inherited version metadata	Обрабатывает унаследованные данные версий
Keeps every instance isolated	Разделяет все сборки
Tracks installed content and available updates	Отслеживает установленный контент и обновления
Manages local Minecraft profiles, stable offline UUIDs, skin previews and quick account switching for each launch.	Управляет локальными профилями Minecraft, постоянными автономными UUID, просмотром скинов и быстрым переключением профилей.
Profiles · UUIDs · skins	Профили · UUID · скины
UI · launch settings	Интерфейс · настройки запуска
Skins	Скины
Account model	Модель аккаунта
Launch identity	Игровой профиль
Keeps identity stable between sessions	Сохраняет профиль между сеансами
Provides the active launch account	Предоставляет активный игровой аккаунт
Separates profile data from instance data	Отделяет данные профиля от данных сборки
Makes the launch process inspectable with timestamps, severity colors, filters, search, copy, export and crash-focused errors.	Показывает процесс запуска со временем событий, цветными уровнями, фильтрами, поиском, копированием, экспортом и ошибками сбоев.
Output · filters · export	Вывод · фильтры · экспорт
QProcess · launcher signals	QProcess · сигналы лаунчера
Log stream	Поток журнала
Visible error	Видимая ошибка
Shows stdout and stderr in context	Показывает stdout и stderr вместе с контекстом
Keeps the exact failure reason visible	Сохраняет точную причину сбоя на виду
Supports fast search and log sharing	Поддерживает быстрый поиск и отправку журнала
Open the Console guide for the full diagnostic path	Откройте руководство по Консоли для полного плана диагностики
Spectral support note	Обращение в поддержку Spectral
Issue	Проблема
Minecraft version	Версия Minecraft
Java version	Версия Java
Error or observation	Ошибка или наблюдение
Copied. Review it before sharing.	Скопировано. Проверьте сообщение перед отправкой.
Copy unavailable here. Select the preview text instead.	Копирование недоступно. Выделите текст предпросмотра.
Your profile	Ваш профиль
Shape the identity other players see.	Настройте профиль, который видят другие игроки.
Roles & plans	Роли и планы
Compare the collection and save a launch plan.	Сравните коллекцию и сохраните план к запуску.
Admin center	Центр администрирования
Review people, community ideas and activity.	Проверяйте пользователей, идеи сообщества и активность.
Your profile has unsaved changes.	В профиле есть несохранённые изменения.
Profile changes are saved when you press Save.	Изменения профиля сохраняются после нажатия «Сохранить».
Community data is unavailable. Apply the community administration migration or retry the connection.	Данные сообщества недоступны. Примените обновление схемы сообщества или повторите подключение.
Sign in to submit an idea.	Войдите, чтобы предложить идею.
Automatic review is unavailable. Please try again later.	Автоматическая проверка недоступна. Попробуйте позже.
Sign in to vote.	Войдите, чтобы голосовать.
Reconnect to moderation.	Восстановите соединение с модерацией.
The server rejected this review.	Сервер отклонил решение проверки.
boosted signal	усиленный сигнал
A clear starting point	Начальная точка
Reviewed account changes will appear here with their reason.	Здесь появятся проверенные изменения аккаунтов с указанием причин.
`);

window.SpectralI18n.addCatalog(String.raw`
Developer of Spectral	Разработчик Spectral
Keeping the servers tidy	Поддерживаю порядок на серверах
Forum moderator	Модератор форума
Minecraft enthusiast	Увлекаюсь Minecraft
Been here since day one	Здесь с первого дня
Builder	Строитель
Add 3D skin preview in launcher	Добавить просмотр скина в 3D в лаунчере
It would be great to see a 3D skin preview in the Accounts tab, similar to NameMC. Would make it much easier to see how your skin looks before launching.	Было бы здорово видеть скин в 3D на вкладке «Аккаунты», как в NameMC. Так проще понять, как он выглядит до запуска игры.
Dark/Light theme toggle	Переключатель тёмной и светлой темы
Please add an option to switch between dark and light themes. Some players prefer a lighter interface when playing during the day.	Добавьте переключение тёмной и светлой темы. Днём некоторым игрокам удобнее светлый интерфейс.
Wait for the current Minecraft profile change to finish.	Дождитесь завершения текущего изменения профиля Minecraft.
Sign in again before changing Minecraft profiles.	Войдите ещё раз перед изменением профилей Minecraft.
Reconnect to save Minecraft profiles online.	Восстановите соединение, чтобы сохранить профили Minecraft в сети.
Invalid Minecraft profile data.	Неверные данные профиля Minecraft.
The database did not confirm the Minecraft profile change.	База данных не подтвердила изменение профиля Minecraft.
The selected Minecraft profile was not saved.	Выбранный профиль Minecraft не сохранился.
The database did not confirm the final Minecraft profile list.	База данных не подтвердила итоговый список профилей Minecraft.
The account changed while saving Minecraft profiles.	Аккаунт изменился во время сохранения профилей Minecraft.
Storage is full. Free some space and try again.	Хранилище заполнено. Освободите место и попробуйте ещё раз.
Minecraft profiles could not be saved online. Please try again.	Не удалось сохранить профили Minecraft в сети. Попробуйте ещё раз.
The account profile is missing from Supabase. Apply the Auth profile migration.	Профиль аккаунта отсутствует в Supabase. Примените обновление схемы профилей Auth.
Profiles, community ideas, themes and developer tools now live in one polished website experience.	Профили, идеи сообщества, темы и инструменты разработчиков теперь объединены на сайте.
Refined typography, a richer Accounts layout and an experimental SpectrAI panel.	Улучшенные шрифты, обновлённая вкладка «Аккаунты» и экспериментальная панель SpectrAI.
Faster launches, clearer diagnostics and more reliable setup for modded Minecraft instances.	Более быстрый запуск, понятная диагностика и надёжная настройка сборок Minecraft с модами.
A consistent launcher interface with a redesigned console and complete RU / EN localization.	Единый интерфейс лаунчера с обновлённой Консолью и полным переводом RU / EN.
The Qt 6 and C++17 foundation behind instances, Java management, versions, mods and diagnostics.	Основа Qt 6 и C++17 для сборок, Java, версий, модов и диагностики.
Launcher improvements and release notes.	Улучшения лаунчера и заметки о выпусках.
Typography & SpectrAI Assistant	Шрифты и помощник SpectrAI
Refined typography, a richer Accounts layout and the first integrated SpectrAI assistant experience.	Улучшенные шрифты, обновлённая вкладка «Аккаунты» и первый встроенный помощник SpectrAI.
Built-in SpectrAI assistant: a sliding chat panel that helps with mods, memory and launch errors	Встроенный помощник SpectrAI: выдвижная панель чата для вопросов о модах, памяти и ошибках запуска
The essential Spectral identity	Базовый стиль Spectral
2 launcher profiles	2 профиля лаунчера
1 favorite profile	1 избранный профиль
Nebula Drift animated header	Анимированный фон «Туманность»
Soft Signal menu entrance	Плавное появление меню
Permanent founder status	Постоянный статус основателя
4 launcher profiles and 3 favorites	4 профиля лаунчера и 3 избранных
Veteran Archive animated header	Анимированный фон «Архив ветерана»
Aurora menu entrance effect	Появление меню «Сияние»
Built for everyday players	Для повседневной игры
8 launcher profiles and favorites	8 профилей лаунчера и избранных
Golden nameplate and avatar frame	Золотая табличка имени и рамка аватара
Solar Flux animated header	Анимированный фон «Солнечный поток»
Solar profile identity effects	Солнечные эффекты профиля
A rare community presence	Редкий статус в сообществе
16 launcher profiles and favorites	16 профилей лаунчера и избранных
Violet Crown animated header	Анимированный фон «Фиолетовая корона»
Stardust profile-menu entrance	Появление меню «Звёздная пыль»
Violet nameplate and avatar frame	Фиолетовая табличка имени и рамка аватара
The complete Spectral experience	Все возможности Spectral
Unlimited profiles and favorites	Неограниченные профили и избранные
Prism Rift animated header	Анимированный фон «Призматический разлом»
Prismatic nameplate and Rift entrance	Призматическая табличка имени и появление «Разлом»
All premium profile appearances	Все премиальные стили профиля
Community moderation access	Доступ к модерации сообщества
Guardian Grid staff header	Служебный фон «Сетка хранителя»
Moderation queue and safety tools	Очередь модерации и инструменты безопасности
Verified staff identity effects	Подтверждённые эффекты служебного профиля
Full community management	Полное управление сообществом
Command Core animated header	Анимированный фон «Командное ядро»
User and role management suite	Инструменты управления пользователями и ролями
Live community analytics access	Доступ к аналитике сообщества
Every animated header and entrance	Все анимированные фоны и появления
Safe preview of every account role	Безопасный предпросмотр всех ролей аккаунта
Release publishing and experiments	Публикация выпусков и эксперименты
Developer-only Code Matrix identity	Стиль Code Matrix только для разработчиков
Spectral development team	Команда разработчиков Spectral
Your starting role: Player	Ваша начальная роль: Игрок
The automatic Veteran reward closed on May 1, 2027.	Автоматическое назначение Veteran завершилось 1 мая 2027 года.
Microsoft (legacy profile)	Microsoft (старый профиль)
`);

window.SpectralI18n.addCatalog(String.raw`
Accept	Принять
Public profile	Публичный профиль
About this player	Об игроке
Role access	Доступ роли
slots	слоты
Player overview	Обзор игрока
Requests received	Полученные запросы
Requests sent	Отправленные запросы
Animated header	Анимированный фон
Developer Role Lab	Лаборатория ролей разработчика
Inspect every role without losing developer access.	Изучайте все роли, сохраняя доступ разработчика.
The selected role changes badges, colors, limits and presentation for your account preview. Administration and developer permissions remain untouched.	Выбранная роль меняет значки, цвета, лимиты и оформление в предпросмотре аккаунта. Права администратора и разработчика сохраняются.
Viewing now	Сейчас показано
Reset to Developer	Вернуться к роли разработчика
Sign-in name	Имя для входа
Actual role	Настоящая роль
Joined	Дата регистрации
Password recovery	Восстановление пароля
Account permissions	Права аккаунта
SAVED ON THIS DEVICE	СОХРАНЕНО НА УСТРОЙСТВЕ
$ indicative price · no active subscription	Ориентировочная цена в $ · подписка не активна
Remove choice	Убрать выбор
SPECTRAL / ROLE STUDIO	SPECTRAL / СТУДИЯ РОЛЕЙ
Choose your	Выберите свой
next form.	новый образ.
Every role has its own look, room for more identities, and a different way to move through Spectral. Explore the collection before saving a plan.	У каждой роли свой стиль, лимит профилей и возможности в Spectral. Изучите коллекцию перед сохранением плана.
Explore	Смотреть
Compare	Сравнить
Save for launch	Сохранить к запуску
IDENTITY / EVOLVED	НОВЫЙ ОБРАЗ
YOUR CURRENT ROLE	ВАША ТЕКУЩАЯ РОЛЬ
YOUR ACCESS NOW	ВАШ ДОСТУП СЕЙЧАС
LIVE ACCOUNT LIMITS	ТЕКУЩИЕ ЛИМИТЫ АККАУНТА
THE COLLECTION / 01	КОЛЛЕКЦИЯ / 01
Find your role	Найдите свою роль
Distinct identities, clear limits, and pricing you can compare.	Разные стили, понятные лимиты и цены для сравнения.
SAVE 20%	ЭКОНОМИЯ 20%
THE DETAILS / 02	ПОДРОБНОСТИ / 02
Compare every detail	Сравните всё
See exactly what changes across capacity, appearance, and access.	Узнайте, что меняется в лимитах, оформлении и доступе.
Saving a launch choice on this device does not charge you or activate a role. Staff access is assigned by the server.	Сохранение выбора на устройстве не списывает деньги и не активирует роль. Служебный доступ назначается сервером.
YOUR SELECTION / 03	ВАШ ВЫБОР / 03
Save this plan to revisit at launch.	Сохраните план и вернитесь к нему при запуске.
Save plan	Сохранить план
access	доступ
DEVELOPER PREVIEW	ПРЕДПРОСМОТР РАЗРАБОТЧИКА
appearance	оформление
Only the visual preview changes. Your actual Developer permissions remain active.	Меняется только внешний вид. Ваши настоящие права разработчика сохраняются.
Reset	Сбросить
profiles	профили
favorites	избранные
INCLUDED WITH	ВКЛЮЧЕНО В
SAVED FOR LAUNCH · THIS DEVICE	СОХРАНЕНО К ЗАПУСКУ · ЭТО УСТРОЙСТВО
$ indicative price · no charge or role activation	Ориентировочная цена в $ · без оплаты и активации роли
ADMIN WORKSPACE	ПАНЕЛЬ АДМИНИСТРАТОРА
Keep access understandable.	Управляйте доступом понятно.
Review people, changes, community posts and site health from one calm workspace.	Проверяйте пользователей, изменения, записи сообщества и состояние сайта в одной панели.
Reviewed changes	Проверенные изменения
Site overview	Обзор сайта
COMMUNITY QUEUE	ОЧЕРЕДЬ СООБЩЕСТВА
Review ideas with context.	Проверяйте идеи с учётом контекста.
ACCOUNT HISTORY	ИСТОРИЯ АККАУНТА
Every reviewed change has a reason.	У каждого проверенного изменения есть причина.
SITE OVERVIEW	ОБЗОР САЙТА
What is happening right now?	Что происходит сейчас?
Refresh data	Обновить данные
Inspect	Просмотреть
Inspect access and activity without leaving the list.	Просматривайте доступ и активность, не покидая список.
AVATAR AWAITING REVIEW	АВАТАР ОЖИДАЕТ ПРОВЕРКИ
ACCOUNT DETAILS	ДАННЫЕ АККАУНТА
Site time	Время на сайте
Account id	ID аккаунта
Previous	Назад
Next	Вперёд
selected	выбрано
Restrict	Ограничить
Why is this change needed?	Зачем нужно это изменение?
Apply reviewed change	Применить проверенное изменение
No reviewed changes yet	Проверенных изменений пока нет
Accounts in directory	Аккаунтов в списке
Total site time	Общее время на сайте
Published ideas	Опубликованные идеи
Awaiting review	Ожидают проверки
COMMUNITY REVIEW	ПРОВЕРКА СООБЩЕСТВА
idea	идея
Reason for this decision	Причина решения
Save review	Сохранить решение
Administration needs a connection	Для администрирования нужно соединение
Retry	Повторить
Account details	Данные аккаунта
Access level	Уровень доступа
MC profiles	Профили Minecraft
Registered	Зарегистрирован
User ID	ID пользователя
Copy ID	Скопировать ID
Export user	Экспортировать пользователя
Protected account	Защищённый аккаунт
upvote	голос
Role Distribution	Распределение ролей
Account Types	Типы аккаунтов
Top Time on Site	Больше всего времени на сайте
Recent Signups	Недавние регистрации
Developer Tools	Инструменты разработчика
Export Database	Экспортировать базу данных
Reload My Account	Обновить мой аккаунт
Reset Local Data	Сбросить локальные данные
Remote scope:	Область удалённого доступа:
`);
// Keep native selects as the form state, while presenting one consistent menu.
window.SpectralControls = (() => {
    const controls = new Map();
    let openControl = null;
    let menu = null;
    let nextId = 0;
    let scanQueued = false;
    let tooltipTarget = null;
    let tooltipTimer = 0;
    const tooltip = document.createElement('div');
    tooltip.className = 'site-tooltip';
    tooltip.setAttribute('aria-hidden', 'true');

    function migrateTitle(element) {
        if (!element?.hasAttribute?.('title')) return;
        const value = element.getAttribute('title')?.trim();
        element.removeAttribute('title');
        if (!value) return;
        element.dataset.siteTip = value;
        if (element.matches('button, a, [tabindex]') && !element.hasAttribute('aria-label')) {
            element.setAttribute('aria-label', value);
        }
    }

    function scanTitles(root = document) {
        if (root.matches?.('[title]')) migrateTitle(root);
        root.querySelectorAll?.('[title]').forEach(migrateTitle);
    }

    function hideTooltip() {
        clearTimeout(tooltipTimer);
        tooltipTarget = null;
        tooltip.remove();
    }

    function showTooltip(target) {
        if (!target?.isConnected || !target.dataset.siteTip) return;
        tooltipTarget = target;
        tooltip.textContent = target.dataset.siteTip;
        document.body.appendChild(tooltip);
        const anchor = target.getBoundingClientRect();
        const bounds = tooltip.getBoundingClientRect();
        const left = Math.min(Math.max(10, anchor.left + anchor.width / 2 - bounds.width / 2), innerWidth - bounds.width - 10);
        const below = innerHeight - anchor.bottom > bounds.height + 12;
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${below ? anchor.bottom + 9 : Math.max(8, anchor.top - bounds.height - 9)}px`;
    }

    // Register before the translation observer so dynamic English titles are kept.
    scanTitles();
    new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes') migrateTitle(mutation.target);
            else for (const node of mutation.addedNodes) if (node.nodeType === Node.ELEMENT_NODE) scanTitles(node);
        }
        if (tooltipTarget && !tooltipTarget.isConnected) hideTooltip();
    }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['title'] });

    document.addEventListener('pointerover', event => {
        const target = event.target.closest?.('[data-site-tip]');
        if (!target || target === tooltipTarget) return;
        hideTooltip();
        tooltipTimer = setTimeout(() => showTooltip(target), 400);
    });
    document.addEventListener('pointerout', event => {
        const target = event.target.closest?.('[data-site-tip]');
        if (target && !target.contains(event.relatedTarget)) hideTooltip();
    });
    document.addEventListener('focusin', event => {
        const target = event.target.closest?.('[data-site-tip]');
        if (target) { hideTooltip(); showTooltip(target); }
    });
    document.addEventListener('focusout', event => {
        if (tooltipTarget === event.target) hideTooltip();
    });
    document.addEventListener('scroll', hideTooltip, true);
    window.addEventListener('resize', hideTooltip);
    document.addEventListener('spectral:languagechange', () => {
        if (tooltipTarget) showTooltip(tooltipTarget);
    });

    function enhanceSearch(input) {
        if (input.dataset.siteSearchReady) return;
        const parent = input.parentElement;
        if (!parent) return;
        input.dataset.siteSearchReady = 'true';
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'site-search-clear';
        clear.setAttribute('aria-label', 'Clear search');
        clear.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i>';
        const syncClear = () => { clear.hidden = !input.value; };
        const shortcut = parent.querySelector('kbd');
        if (shortcut) shortcut.before(clear);
        else input.after(clear);
        input.addEventListener('input', syncClear);
        input.form?.addEventListener('reset', () => setTimeout(syncClear, 0));
        clear.addEventListener('click', event => {
            event.preventDefault();
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
        });
        syncClear();
    }

    function enhancePassword(input) {
        if (input.dataset.sitePasswordReady) return;
        const parent = input.parentElement;
        if (!parent) return;
        input.dataset.sitePasswordReady = 'true';
        parent.classList.add('site-password-field');
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'site-password-toggle';
        toggle.setAttribute('aria-label', 'Show password');
        toggle.setAttribute('aria-pressed', 'false');
        const icon = document.createElement('i');
        icon.className = 'fas fa-eye';
        icon.setAttribute('aria-hidden', 'true');
        toggle.appendChild(icon);
        parent.appendChild(toggle);
        toggle.addEventListener('click', event => {
            event.preventDefault();
            const revealed = input.type === 'password';
            input.type = revealed ? 'text' : 'password';
            toggle.setAttribute('aria-label', revealed ? 'Hide password' : 'Show password');
            toggle.setAttribute('aria-pressed', String(revealed));
            icon.className = revealed ? 'fas fa-eye-slash' : 'fas fa-eye';
            input.focus();
        });
    }

    function labelFor(select) {
        const explicit = select.getAttribute('aria-label');
        if (explicit) return explicit;
        const label = select.labels?.[0];
        const first = label?.firstChild?.textContent?.trim();
        return first || select.id || 'Choose an option';
    }

    function sync(select) {
        const control = controls.get(select);
        if (!control || !select.isConnected) return;
        const selected = select.selectedOptions[0];
        const text = selected?.textContent.trim() || 'Choose an option';
        if (control.text.textContent !== text) control.text.textContent = text;
        // A disabled attribute mutation makes the select observer scan again.
        // Writing the same value here can otherwise keep the main thread busy.
        if (control.trigger.disabled !== select.disabled) control.trigger.disabled = select.disabled;
        const label = `${labelFor(select)}: ${text}`;
        if (control.trigger.getAttribute('aria-label') !== label) control.trigger.setAttribute('aria-label', label);
        if (menu && openControl?.select === select) {
            menu.querySelectorAll('[data-select-index]').forEach(option => {
                option.setAttribute('aria-selected', String(Number(option.dataset.selectIndex) === select.selectedIndex));
            });
        }
    }

    function close(restoreFocus = false) {
        if (!openControl) return;
        const trigger = openControl.trigger;
        trigger.setAttribute('aria-expanded', 'false');
        trigger.removeAttribute('aria-controls');
        openControl.wrapper.classList.remove('is-open');
        menu?.remove();
        menu = null;
        openControl = null;
        if (restoreFocus && trigger.isConnected) trigger.focus();
    }

    function placeMenu(control) {
        if (!menu) return;
        const rect = control.trigger.getBoundingClientRect();
        const width = Math.min(Math.max(rect.width, 190), innerWidth - 24);
        const left = Math.min(Math.max(12, rect.left), innerWidth - width - 12);
        menu.style.width = `${width}px`;
        menu.style.left = `${left}px`;
        menu.style.maxHeight = `${Math.min(300, Math.max(140, innerHeight - 36))}px`;
        const height = menu.getBoundingClientRect().height;
        const below = innerHeight - rect.bottom;
        const above = rect.top;
        const openUp = below < height + 10 && above > below;
        menu.style.top = `${openUp ? Math.max(12, rect.top - height - 8) : Math.min(innerHeight - height - 12, rect.bottom + 8)}px`;
        menu.classList.toggle('opens-up', openUp);
    }

    function open(control, focusSelected = false) {
        if (openControl === control) { close(); return; }
        close();
        sync(control.select);
        if (control.select.disabled) return;
        menu = document.createElement('div');
        menu.id = control.menuId;
        menu.className = 'site-select-menu';
        menu.setAttribute('role', 'listbox');
        menu.setAttribute('aria-label', labelFor(control.select));
        [...control.select.options].forEach((nativeOption, index) => {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'site-select-option';
            option.setAttribute('role', 'option');
            option.setAttribute('aria-selected', String(index === control.select.selectedIndex));
            option.dataset.selectIndex = String(index);
            option.disabled = nativeOption.disabled;
            option.textContent = nativeOption.textContent.trim();
            option.addEventListener('click', () => {
                if (nativeOption.disabled) return;
                const changed = control.select.selectedIndex !== index;
                control.select.selectedIndex = index;
                close(true);
                sync(control.select);
                if (changed) {
                    control.select.dispatchEvent(new Event('input', { bubbles: true }));
                    control.select.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
            menu.appendChild(option);
        });
        document.body.appendChild(menu);
        openControl = control;
        control.trigger.setAttribute('aria-expanded', 'true');
        control.trigger.setAttribute('aria-controls', control.menuId);
        control.wrapper.classList.add('is-open');
        placeMenu(control);
        if (focusSelected) menu.querySelector('[aria-selected="true"]:not(:disabled)')?.focus();
    }

    function enhance(select) {
        if (controls.has(select) || select.closest('.site-select')) return;
        const wrapper = document.createElement('span');
        wrapper.className = 'site-select';
        if (select.closest('.news-item-row')) wrapper.classList.add('site-select--news-item');
        if (select.closest('.admin-v2-user-action, .admin-user-row')) wrapper.classList.add('site-select--user-role');
        if (select.closest('.admin-v2-bulk, .admin-bulk-bar')) wrapper.classList.add('site-select--bulk');
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'site-select-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        const menuId = `siteSelectMenu${++nextId}`;
        const text = document.createElement('span');
        text.className = 'site-select-value';
        const arrow = document.createElement('i');
        arrow.className = 'fas fa-chevron-down site-select-chevron';
        arrow.setAttribute('aria-hidden', 'true');
        trigger.append(text, arrow);
        select.before(wrapper);
        wrapper.append(select, trigger);
        select.classList.add('site-select-native');
        select.tabIndex = -1;
        select.setAttribute('aria-hidden', 'true');
        const control = { select, wrapper, trigger, text, menuId };
        controls.set(select, control);
        sync(select);
        trigger.addEventListener('click', event => {
            event.preventDefault();
            open(control);
        });
        trigger.addEventListener('keydown', event => {
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            open(control, true);
            if (event.key === 'End') menu?.querySelector('.site-select-option:last-child:not(:disabled)')?.focus();
            if (event.key === 'Home') menu?.querySelector('.site-select-option:first-child:not(:disabled)')?.focus();
        });
        [...select.labels].forEach(label => label.addEventListener('click', event => {
            if (event.target.closest?.('.site-select-trigger')) return;
            event.preventDefault();
            open(control);
        }));
        select.addEventListener('change', () => sync(select));
    }

    function scan(root = document) {
        if (root.matches?.('select')) enhance(root);
        root.querySelectorAll?.('select:not(.site-select-native)').forEach(enhance);
        if (root.matches?.('input[type="search"]')) enhanceSearch(root);
        root.querySelectorAll?.('input[type="search"]:not([data-site-search-ready])').forEach(enhanceSearch);
        if (root.matches?.('input[type="password"]')) enhancePassword(root);
        root.querySelectorAll?.('input[type="password"]:not([data-site-password-ready])').forEach(enhancePassword);
        for (const [select] of controls) {
            if (select.isConnected) sync(select);
            else controls.delete(select);
        }
    }

    document.addEventListener('pointerdown', event => {
        if (openControl && !openControl.wrapper.contains(event.target) && !menu?.contains(event.target)) close();
    });
    document.addEventListener('keydown', event => {
        if (!openControl) return;
        if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
        if (!menu?.contains(document.activeElement)) return;
        const options = [...menu.querySelectorAll('.site-select-option:not(:disabled)')];
        const index = options.indexOf(document.activeElement);
        let next = index;
        if (event.key === 'ArrowDown') next = (index + 1) % options.length;
        else if (event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = options.length - 1;
        else if (event.key === 'Tab') { close(); return; }
        else return;
        event.preventDefault();
        options[next]?.focus();
    });
    document.addEventListener('focusin', event => {
        if (openControl && !openControl.wrapper.contains(event.target) && !menu?.contains(event.target)) close();
    });
    document.addEventListener('reset', () => setTimeout(() => scan(), 0));
    window.addEventListener('resize', () => openControl && placeMenu(openControl));
    document.addEventListener('scroll', event => {
        if (openControl && event.target !== menu) close();
    }, true);
    document.addEventListener('spectral:languagechange', () => queueMicrotask(() => scan()));
    document.addEventListener('DOMContentLoaded', () => {
        scan();
        new MutationObserver(mutations => {
            if (scanQueued || !mutations.some(mutation =>
                mutation.type === 'attributes' || [...mutation.addedNodes].some(node =>
                    node.nodeType === Node.ELEMENT_NODE && (node.matches?.('select, option, input[type="search"], input[type="password"]') || node.querySelector?.('select, option, input[type="search"], input[type="password"]'))
                )
            )) return;
            scanQueued = true;
            queueMicrotask(() => { scanQueued = false; scan(); });
        }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled', 'selected'] });
    });

    return { refresh: () => scan(), close };
})();
// Shared, DOM-free account rules. Cloud permissions must also be enforced by RLS/RPC.
const AccountPolicy = Object.freeze({
    ranks: Object.freeze({USER:0,VETERAN:1,PRO:2,LEGEND:3,SPECTRAL:4,MODERATOR:10,ADMIN:20,DEV:30}),
    nameIssue(value){
        const name=String(value||'').normalize('NFKC').toLowerCase();
        if(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/.test(name))return 'Invisible or control characters are not allowed in names.';
        if(/(?:https?:|www\.|@|\.(?:com|ru|net|org|gg|io)\b|discord|telegram|t\.me\/)/i.test(name))return 'Names cannot contain links or contact details.';
        const tokens=name.split(/[ _.-]+/).filter(Boolean);
        if(tokens.some(token=>/[a-z]/.test(token)&&/[а-яёіїєґ]/.test(token)))return 'Do not mix alphabets inside a name.';
        const rawCompact=name.replace(/[^a-zа-яёіїєґ0-9]/g,'');
        const compact=rawCompact.replace(/[013457]/g,char=>({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t'}[char]));
        const latin=compact.replace(/[аеорсухі]/g,char=>({'а':'a','е':'e','о':'o','р':'p','с':'c','у':'y','х':'x','і':'i'}[char]));
        if(/^(?:admin|administrator|moderator|mod|support|staff|owner|developer|dev|official|spectral(?:team|admin|mod|support|official)?|officialspectral|админ|модератор|поддержка|разработчик)[0-9]{0,4}$/.test(rawCompact)
            ||/^(?:admin|administrator|moderator|mod|support|staff|owner|developer|dev|official|spectral(?:team|admin|mod|support|official)?|officialspectral|админ|модератор|поддержка|разработчик)$/.test(compact)
            ||/^(?:admin|administrator|moderator|mod|support|staff|owner|developer|dev|official|spectral(?:team|admin|mod|support|official)?|officialspectral)[0-9]{0,4}$/.test(latin))return 'This staff name is reserved.';
        if(/(?:fuck|cunt|nigg|bitch|fagg|хуй|хуе|пизд|бляд|блят|ебат|ебан|сука)/.test(compact)||/(?:fuck|cunt|nigg|bitch|fagg)/.test(latin))return 'Choose a name without offensive language.';
        return '';
    },
    canManage(actor,target,role=null){
        if(!actor||actor.banned||!target||actor.id===target.id)return false;
        const rank=this.ranks[actor.role]??-1;
        if(rank<20||!(target.role in this.ranks))return false;
        if(actor.role!=='DEV'&&this.ranks[target.role]>=rank)return false;
        return role===null||(role in this.ranks&&(actor.role==='DEV'||this.ranks[role]<rank));
    },
    reservations(value){
        if(!Array.isArray(value))return [];
        const seen=new Set();
        return value.slice().reverse().filter(order=>{
            if(!order||!/^[-\w]{1,100}$/.test(order.userId||'')||!['PRO','LEGEND','SPECTRAL'].includes(order.role)||!['monthly','yearly'].includes(order.billing)||order.status!=='reserved'||!Number.isFinite(order.quotedPrice)||order.quotedPrice<0||seen.has(order.userId))return false;
            seen.add(order.userId);return true;
        }).slice(0,250).map(order=>({id:String(order.id||'').slice(0,100),userId:order.userId,role:order.role,billing:order.billing,quotedPrice:order.quotedPrice,currency:'USD',status:'reserved',createdAt:String(order.createdAt||'').slice(0,40)})).reverse();
    },
    recent(value,windowMs,now=Date.now()){
        const time=new Date(value).getTime();
        return Boolean(value)&&Number.isFinite(time)&&time<=now&&now-time<=windowMs;
    }
});
// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {

// ── Particles ────────────────────────────────────────────────
const canvas = document.getElementById('particles-canvas');
if (!canvas) return;
let ctx = null;
try { ctx = canvas.getContext('2d'); } catch {}
let particles = [], canvasWidth, canvasHeight, animationId;
let mouse = { x: -9999, y: -9999, active: false };
let canvasRunning = false;
let lastCanvasFrame = 0;
// Touch devices: lighter background, no pointer-driven effects (saves battery/jank)
const IS_TOUCH = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let REDUCED_MOTION = reducedMotionQuery.matches;
// Lightweight mode: weak devices skip the heavy canvas/tilt/parallax work.
// The class is set super-early by boot.min.js in the document head.
function liteOn() { return document.documentElement.classList.contains('lite-mode'); }
function canvasShouldIdle() { return !ctx || liteOn() || REDUCED_MOTION || window.innerWidth <= 620; }
if (!liteOn() && !REDUCED_MOTION) document.addEventListener('mouseleave', () => { mouse.active = false; });
function resizeCanvas() {
    if (canvasShouldIdle()) {
        // A hidden canvas still owns its backing bitmap unless it is released.
        canvas.width = canvas.height = 0;
        canvasWidth = canvasHeight = 0;
        particles = [];
        return;
    }
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    canvasWidth = canvas.width; canvasHeight = canvas.height; initParticles();
}
function initParticles() {
    particles = [];
    if (canvasShouldIdle()) return;
    // Fewer particles on phones/tablets — the O(n²) link drawing is the heavy part
    const cap = IS_TOUCH ? 16 : 48;
    const count = Math.min(cap, Math.floor((canvasWidth * canvasHeight) / 22000));
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(Math.random()*canvasWidth, Math.random()*canvasHeight,
            1.5+Math.random()*3.5, (Math.random()-.5)*.6, (Math.random()-.5)*.6, 210+Math.random()*120));
    }
}
// ── Runtime FPS watchdog ─────────────────────────────────────
// Some devices report plenty of cores yet still chug. If the canvas
// can't hold a decent frame rate during the first couple of seconds
// (and the user hasn't explicitly chosen a mode), drop to lite mode.
let _perfStart = null, _perfLastFrame = null, _perfFrames = 0, _perfChecked = false;
function resetFpsSample() { _perfStart = null; _perfLastFrame = null; _perfFrames = 0; }
function checkFps(ts) {
    if (_perfChecked || !window.__SPECTRAL_LITE_AUTO) return;
    // Sleeping computers and background tabs must not count as dropped frames.
    if (_perfLastFrame !== null && ts - _perfLastFrame > 1000) resetFpsSample();
    _perfLastFrame = ts;
    if (_perfStart === null) { _perfStart = ts; return; }
    const elapsed = ts - _perfStart;
    if (elapsed < 900) return;            // warm-up grace period
    _perfFrames++;
    if (elapsed >= 4500) {                // longer sample avoids false positives during page startup
        _perfChecked = true;
        const fps = (_perfFrames * 1000) / (elapsed - 900);
        if (fps < 24 && typeof enableLiteMode === 'function') enableLiteMode(false, true);
    }
}
function animate(ts) {
    if (canvasShouldIdle() || document.hidden) { canvasRunning = false; cancelAnimationFrame(animationId); return; }
    canvasRunning = true;
    checkFps(ts || performance.now());
    const now = ts || performance.now();
    const minFrame = IS_TOUCH ? 32 : 16;
    const elapsed = lastCanvasFrame ? now - lastCanvasFrame : 16.67;
    if (elapsed < minFrame) { animationId = requestAnimationFrame(animate); return; }
    lastCanvasFrame = now;
    const frameStep = Math.min(2, elapsed / 16.67);
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    particles.forEach(p => { p.update(canvasWidth,canvasHeight,mouse,frameStep); p.draw(ctx,IS_TOUCH); });
    animationId = requestAnimationFrame(animate);
}
window.addEventListener('resize', () => {
    clearTimeout(window._resizeTimer);
    window._resizeTimer = setTimeout(() => {
        resizeCanvas();
        if (!canvasShouldIdle() && !canvasRunning) animate(performance.now());
    }, 200);
});
resizeCanvas();
if (!canvasShouldIdle()) animate();
const handleReducedMotionChange = event => {
    REDUCED_MOTION = event.matches;
    mouse.active = false;
    cancelAnimationFrame(animationId);
    canvasRunning = false;
    if (ctx) ctx.clearRect(0,0,canvasWidth,canvasHeight);
    document.querySelectorAll('.animate-on-scroll,.timeline-item').forEach(element=>element.classList.add('visible','in-view'));
    resizeCanvas();
    if (!canvasShouldIdle() && !document.hidden) animate(performance.now());
};
if (typeof reducedMotionQuery.addEventListener === 'function') reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
else if (typeof reducedMotionQuery.addListener === 'function') reducedMotionQuery.addListener(handleReducedMotionChange);

// Pause continuous canvas work in background tabs and resume with a clean frame.
document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('motion-paused', document.hidden);
    if (document.hidden) {
        resetFpsSample();
        canvasRunning = false;
        cancelAnimationFrame(animationId);
        return;
    }
    lastCanvasFrame = performance.now();
    if (!canvasShouldIdle() && !canvasRunning) animate(lastCanvasFrame);
});

// One shared pointer update drives the background glow without layout work.
let atmosphereRaf = null;
document.addEventListener('pointermove', e => {
    if (liteOn() || IS_TOUCH || REDUCED_MOTION) return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    if (atmosphereRaf) return;
    atmosphereRaf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--pointer-x', `${mouse.x}px`);
        document.documentElement.style.setProperty('--pointer-y', `${mouse.y}px`);
        atmosphereRaf = null;
    });
}, { passive: true });

// ── Tab navigation ───────────────────────────────────────────
// Keep visually hidden dialogs out of keyboard and assistive-technology navigation.
const dialogOverlays = [...document.querySelectorAll('[role="dialog"]')];
const dialogStates = new WeakMap();
const DIALOG_FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
].join(',');
function dialogFocusableElements(dialog) {
    return [...dialog.querySelectorAll(DIALOG_FOCUSABLE)].filter(element => {
        const style = getComputedStyle(element);
        return !element.closest('[hidden],[inert]')
            && style.display !== 'none'
            && style.visibility !== 'hidden'
            && element.getClientRects().length > 0;
    });
}
function topOpenDialog() {
    return dialogOverlays
        .filter(dialog => dialog.classList.contains('open'))
        .sort((a, b) => (parseInt(getComputedStyle(a).zIndex, 10) || 0) - (parseInt(getComputedStyle(b).zIndex, 10) || 0))
        .pop() || null;
}
function syncDialogStackAccessibility() {
    const top = topOpenDialog();
    dialogOverlays.forEach(dialog => {
        const interactive = dialog === top;
        dialog.setAttribute('aria-hidden', String(!interactive));
        dialog.inert = !interactive;
    });
}
function syncBodyScrollLock() {
    if (topOpenDialog()) document.body.style.overflow = 'hidden';
    else if (!document.body.classList.contains('nav-menu-open')) document.body.style.overflow = '';
}
function syncDialogAccessibility(dialog) {
    const open = dialog.classList.contains('open');
    dialog.setAttribute('aria-hidden', String(!open));
    dialog.inert = !open;
    const previous = dialogStates.get(dialog);
    if (!previous) {
        dialogStates.set(dialog, { open, returnFocus: null });
        syncDialogStackAccessibility();
        return;
    }
    if (previous.open === open) {
        syncDialogStackAccessibility();
        return;
    }
    previous.open = open;
    if (open) {
        previous.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        requestAnimationFrame(() => {
            if (!dialog.classList.contains('open')) return;
            const [first] = dialogFocusableElements(dialog);
            if (first) first.focus();
            else {
                dialog.setAttribute('tabindex', '-1');
                dialog.focus();
            }
        });
    } else {
        const returnFocus = previous.returnFocus;
        previous.returnFocus = null;
        requestAnimationFrame(() => {
            const canReturn = returnFocus?.isConnected
                && typeof returnFocus.focus === 'function'
                && returnFocus.matches?.(DIALOG_FOCUSABLE)
                && !returnFocus.closest('[hidden],[inert]')
                && returnFocus.getClientRects().length > 0;
            if (canReturn) returnFocus.focus();
            else {
                const underlying = topOpenDialog();
                const [fallback] = underlying ? dialogFocusableElements(underlying) : [];
                fallback?.focus();
            }
        });
    }
    syncDialogStackAccessibility();
    syncBodyScrollLock();
}
dialogOverlays.forEach(dialog => {
    syncDialogAccessibility(dialog);
    new MutationObserver(() => syncDialogAccessibility(dialog)).observe(dialog, { attributes: true, attributeFilter: ['class'] });
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        const checkout = document.getElementById('roleCheckoutSheet');
        if (checkout && !checkout.hidden) {
            event.preventDefault();
            document.getElementById('roleCheckoutClose')?.click();
            return;
        }
        const dialog = topOpenDialog();
        if (!dialog) return;
        const dismiss = dialog.querySelector('.close-dashboard, .welcome-close, .close-add-account, .role-checkout-close, #closeHeaderStudioBtn, .confirm-cancel');
        if (dismiss) {
            event.preventDefault();
            dismiss.click();
        }
        return;
    }
    if (event.key !== 'Tab') return;
    const dialog = topOpenDialog();
    if (!dialog) return;
    const focusable = dialogFocusableElements(dialog);
    if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

let scrollObserver = null;
const navButtons = [...document.querySelectorAll('.nav-btn')];
const navIndicator = document.getElementById('navActiveIndicator');
let navIndicatorFrame = 0;
function syncNavIndicator() {
    if (!navIndicator || window.innerWidth <= 1180) return;
    const active = document.querySelector('.nav-links-container .nav-btn.active');
    if (!active) return;
    navIndicator.style.width = `${active.offsetWidth}px`;
    navIndicator.style.transform = `translate3d(${active.offsetLeft}px,0,0)`;
    navIndicator.classList.add('is-ready');
}
function scheduleNavIndicator() {
    cancelAnimationFrame(navIndicatorFrame);
    navIndicatorFrame = requestAnimationFrame(syncNavIndicator);
}
window.addEventListener('resize', scheduleNavIndicator);
if (navIndicator && 'ResizeObserver' in window) new ResizeObserver(scheduleNavIndicator).observe(navIndicator.parentElement);
document.fonts?.ready.then(scheduleNavIndicator);
const SITE_ROUTE_IDS = new Set(navButtons.map(button=>button.getAttribute('data-target')).filter(id=>id&&document.getElementById(id)));
const DEV_SECTION_IDS = new Set(['dev-pipeline','dev-systems','dev-source']);
function validSiteRoute(value){return DEV_SECTION_IDS.has(value)?'development':SITE_ROUTE_IDS.has(value)?value:'home';}
function activateSiteRoute(route,{historyMode='push',animate=true}={}){
    const targetId=validSiteRoute(route);
    const current=document.querySelector('.tab-content.active-tab');
    const next=document.getElementById(targetId);
    if(!next)return false;
    navButtons.forEach(button=>{
        const active=button.getAttribute('data-target')===targetId;
        button.classList.toggle('active',active);
        if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    scheduleNavIndicator();
    if(historyMode==='push'&&location.hash!==`#${targetId}`)history.pushState(null,'',`#${targetId}`);
    else if(historyMode==='replace'&&location.hash!==`#${targetId}`)history.replaceState(null,'',`#${targetId}`);
    if(current===next){window.scrollTo({top:0,behavior:'instant'});return true;}
    document.querySelectorAll('.tab-content').forEach(section=>{
        const active=section===next;
        section.classList.toggle('active-tab',active);
        section.classList.remove('route-enter');
        section.style.removeProperty('display');
        section.style.removeProperty('opacity');
        section.style.removeProperty('transform');
        section.setAttribute('aria-hidden',String(!active));
        section.inert=!active;
    });
    if(animate&&!liteOn()&&!REDUCED_MOTION)next.classList.add('route-enter');
    window.scrollTo({top:0,behavior:'instant'});
    reinitScrollAnimations();
    return true;
}
navButtons.forEach(button => {
    button.addEventListener('click', event => {
        event.preventDefault();
        activateSiteRoute(button.getAttribute('data-target'));
    });
});
window.addEventListener('popstate', () => {
    const hash=window.location.hash.slice(1)||'home';
    activateSiteRoute(hash,{historyMode:'none'});
    if(DEV_SECTION_IDS.has(hash))requestAnimationFrame(()=>scrollBelowNavbar(document.getElementById(hash)));
});
// Hero and footer hash links switch the SPA tab instead of scrolling to hidden content.
document.querySelectorAll('a[href^="#"]:not(.nav-btn)').forEach(link => {
    link.addEventListener('click', event => {
        const targetId = link.getAttribute('href')?.slice(1);
        const target = targetId && document.getElementById(targetId);
        if (!target?.classList.contains('tab-content')) return;
        event.preventDefault();
        activateSiteRoute(targetId);
    });
});
document.querySelectorAll('[data-af-tab]').forEach(button => {
    button.addEventListener('click', () => {
        activateSiteRoute(button.getAttribute('data-af-tab'));
    });
});

// Honour a valid route when the page is opened or refreshed with a hash.
const initialRoute = window.location.hash.slice(1);
// Supabase returns OAuth/recovery tokens in the fragment. Keep it untouched
// until the Auth client has established the session.
const isAuthRedirectHash = /(?:^|&)(?:access_token|refresh_token|error|error_code|type)=/.test(initialRoute);
if(isAuthRedirectHash)activateSiteRoute('home',{historyMode:'none',animate:false});
else if(initialRoute)activateSiteRoute(initialRoute,{historyMode:SITE_ROUTE_IDS.has(initialRoute)||DEV_SECTION_IDS.has(initialRoute)?'none':'replace',animate:false});
else activateSiteRoute('home',{historyMode:'none',animate:false});
if(DEV_SECTION_IDS.has(initialRoute))requestAnimationFrame(()=>scrollBelowNavbar(document.getElementById(initialRoute)));

// ── Scroll animations ────────────────────────────────────────
scrollObserver = (liteOn() || REDUCED_MOTION) ? null : new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (!e.isIntersecting) return;
        requestAnimationFrame(() => e.target.classList.add('visible'));
        scrollObserver.unobserve(e.target);
    });
}, { threshold:0.15, rootMargin:'0px 0px -50px 0px' });
function reinitScrollAnimations() {
    const active = document.querySelector('.tab-content.active-tab');
    if (!active) return;
    const pending = active.querySelectorAll('.animate-on-scroll:not(.visible)');
    if (!scrollObserver) pending.forEach(el => el.classList.add('visible'));
    else pending.forEach(el => scrollObserver.observe(el));
}
document.querySelectorAll('.animate-on-scroll').forEach(el => {
    if (scrollObserver) scrollObserver.observe(el);
    else el.classList.add('visible');
});

// Retarget short content changes without forcing layout between rapid clicks.
const panelChangeMotions = new WeakMap();
function revealUpdatedPanel(element) {
    if (!element || REDUCED_MOTION || liteOn() || !element.animate) return;
    panelChangeMotions.get(element)?.cancel();
    const motion = element.animate([
        { opacity: .86, transform: 'translate3d(0, 6px, 0)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' }
    ], { duration: 280, easing: 'cubic-bezier(.2, .8, .25, 1)' });
    panelChangeMotions.set(element, motion);
    motion.finished.then(() => {
        if (panelChangeMotions.get(element) === motion) panelChangeMotions.delete(element);
    }).catch(() => {});
}

// Home feature deck: deliberate click and keyboard selection avoid hover resize loops.
const homeFeatureCards = [...document.querySelectorAll('[data-home-feature]')];
function activateHomeFeature(card) {
    if (!card || card.classList.contains('is-active')) return;
    homeFeatureCards.forEach(item => {
        const active = item === card;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
        const label = item.querySelector('.feature-card-open b');
        if (label) label.textContent = active ? 'In focus' : 'Focus this tool';
    });
}
homeFeatureCards.forEach((card, index) => {
    card.addEventListener('click', () => activateHomeFeature(card));
    card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activateHomeFeature(card);
            return;
        }
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const step = event.key === 'ArrowRight' ? 1 : -1;
        const next = homeFeatureCards[(index + step + homeFeatureCards.length) % homeFeatureCards.length];
        activateHomeFeature(next);
        next.focus();
    });
});

// ── Magnetic buttons ─────────────────────────────────────────
// A single animation loop serves every magnetic control. Geometry is read once
// on pointer entry instead of on every move, avoiding layout work mid-frame.
if (!liteOn() && !REDUCED_MOTION && !IS_TOUCH) {
    const magneticStates = new WeakMap();
    const activeMagnets = new Set();
    let magneticRaf = null;

    const queueMagneticFrame = () => {
        if (!magneticRaf) magneticRaf = requestAnimationFrame(updateMagnets);
    };
    function updateMagnets() {
        let keepRunning = false;
        activeMagnets.forEach(btn => {
            const state = magneticStates.get(btn);
            const smoothing = .18;
            state.cx += (state.tx - state.cx) * smoothing;
            state.cy += (state.ty - state.cy) * smoothing;
            const moving = Math.abs(state.tx - state.cx) > .08 || Math.abs(state.ty - state.cy) > .08;
            if (moving) {
                keepRunning = true;
                btn.style.transform = `translate3d(${state.cx.toFixed(2)}px,${state.cy.toFixed(2)}px,0)`;
                return;
            }
            state.cx = state.tx;
            state.cy = state.ty;
            if (state.tx === 0 && state.ty === 0) {
                btn.style.removeProperty('transform');
                btn.classList.remove('is-magnetic');
                activeMagnets.delete(btn);
            } else {
                btn.style.transform = `translate3d(${state.cx.toFixed(2)}px,${state.cy.toFixed(2)}px,0)`;
            }
        });
        magneticRaf = keepRunning ? requestAnimationFrame(updateMagnets) : null;
    }

    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        const state = { cx: 0, cy: 0, tx: 0, ty: 0, rect: null };
        magneticStates.set(btn, state);
        btn.addEventListener('pointerenter', () => {
            state.rect = btn.getBoundingClientRect();
            btn.classList.add('is-magnetic');
        }, { passive: true });
        btn.addEventListener('pointermove', event => {
            if (liteOn()) return;
            const rect = state.rect || btn.getBoundingClientRect();
            state.rect = rect;
            state.tx = (event.clientX - rect.left - rect.width / 2) * .3;
            state.ty = (event.clientY - rect.top - rect.height / 2) * .3;
            btn.classList.add('is-magnetic');
            activeMagnets.add(btn);
            queueMagneticFrame();
        }, { passive: true });
        const releaseMagnet = () => {
            state.tx = 0;
            state.ty = 0;
            state.rect = null;
            activeMagnets.add(btn);
            queueMagneticFrame();
        };
        btn.addEventListener('pointerleave', releaseMagnet, { passive: true });
        btn.addEventListener('pointercancel', releaseMagnet, { passive: true });
    });
}

// ── 3D tilt ──────────────────────────────────────────────────
const tiltEls = document.querySelectorAll('.tilt-card-lg,.tilt-card-sm');
const tiltData = new WeakMap();
tiltEls.forEach(el => tiltData.set(el,{cx:0,cy:0,tx:0,ty:0}));
let tiltRaf=null;
const activeTilts = new Set();
function updateTilt(){
    let needs=false;
    activeTilts.forEach(el=>{
        const d=tiltData.get(el),l=.14;
        d.cx+=(d.tx-d.cx)*l; d.cy+=(d.ty-d.cy)*l;
        if(Math.abs(d.tx-d.cx)>.015||Math.abs(d.ty-d.cy)>.015) needs=true;
        else if(d.tx===0&&d.ty===0){ d.cx=0; d.cy=0; activeTilts.delete(el); el.classList.remove('is-tilting'); }
        el.style.transform=`perspective(1200px) rotateX(${d.cx}deg) rotateY(${d.cy}deg) translateZ(0)`;
    });
    if(needs) tiltRaf=requestAnimationFrame(updateTilt); else tiltRaf=null;
}
if (!liteOn() && !IS_TOUCH && !REDUCED_MOTION) tiltEls.forEach(el=>{
    let rect=null, moveRaf=null, latestEvent=null;
    const queue=()=>{ if(!tiltRaf) tiltRaf=requestAnimationFrame(updateTilt); };
    el.addEventListener('pointerenter',()=>{ rect=el.getBoundingClientRect(); el.classList.add('is-tilting'); activeTilts.add(el); queue(); },{passive:true});
    el.addEventListener('pointermove',event=>{
        latestEvent=event;
        if(moveRaf) return;
        moveRaf=requestAnimationFrame(()=>{
            moveRaf=null;
            if(!rect) rect=el.getBoundingClientRect();
            const d=tiltData.get(el), intensity=el.classList.contains('launcher-ui')?95:el.classList.contains('tilt-card-lg')?34:28;
            d.tx=((latestEvent.clientY-rect.top-rect.height/2)/intensity)*-1;
            d.ty=(latestEvent.clientX-rect.left-rect.width/2)/intensity;
            activeTilts.add(el); queue();
        });
    },{passive:true});
    el.addEventListener('pointerleave',()=>{ const d=tiltData.get(el); d.tx=0; d.ty=0; rect=null; activeTilts.add(el); queue(); },{passive:true});
});

// ── Ripple ───────────────────────────────────────────────────
document.querySelectorAll('.btn-primary,.btn-secondary,.lu-play').forEach(btn=>{btn.addEventListener('click',function(e){if(liteOn()||REDUCED_MOTION)return;const r=this.getBoundingClientRect(),sp=document.createElement('span');sp.className='ripple-effect';const keyboardClick=e.detail===0;sp.style.left=(keyboardClick?r.width/2:e.clientX-r.left)+'px';sp.style.top=(keyboardClick?r.height/2:e.clientY-r.top)+'px';this.appendChild(sp);setTimeout(()=>sp.remove(),600);});});

// ── Theme toggle ─────────────────────────────────────────────
const THEME_KEY = 'spectral_theme';
const profileThemeToggle = document.getElementById('profileThemeToggle');
const profileThemeIcon = document.getElementById('profileThemeIcon');
const profileThemeState = document.getElementById('profileThemeState');
const navThemeToggle = document.getElementById('navThemeToggle');
function commitTheme(theme) {
    SPECTRAL_LIGHT = (theme === 'light');
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (profileThemeIcon) profileThemeIcon.className = 'fas fa-sun';
        if (profileThemeState) profileThemeState.textContent = 'Light palette is active';
    } else {
        document.body.classList.remove('light-theme');
        if (profileThemeIcon) profileThemeIcon.className = 'fas fa-moon';
        if (profileThemeState) profileThemeState.textContent = 'Dark palette is active';
    }
    if (profileThemeToggle) profileThemeToggle.checked = (theme === 'light');
    if (navThemeToggle) {
        const nextLabel = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
        navThemeToggle.setAttribute('aria-label', nextLabel);
        navThemeToggle.setAttribute('title', nextLabel);
        navThemeToggle.setAttribute('aria-pressed', String(theme === 'light'));
    }
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === 'light' ? '#f7f8f6' : '#080a18';
}
let selectedTheme = 'dark';
let activeThemeTransition = null;
function applyTheme(theme, animate) {
    selectedTheme = theme;
    if (!animate || REDUCED_MOTION || liteOn()) {
        commitTheme(theme);
        return;
    }
    if (typeof document.startViewTransition === 'function' && !document.getElementById('dashboardOverlay')?.classList.contains('open')) {
        activeThemeTransition?.skipTransition();
        const transition = document.startViewTransition(() => commitTheme(theme));
        activeThemeTransition = transition;
        transition.finished.catch(() => {}).finally(() => {
            if (activeThemeTransition === transition) activeThemeTransition = null;
        });
        return;
    }
    document.body.classList.add('theme-switching');
    commitTheme(theme);
    setTimeout(() => document.body.classList.remove('theme-switching'), 520);
}
let initialTheme = 'dark';
try { initialTheme = localStorage.getItem(THEME_KEY) || 'dark'; } catch {}
applyTheme(initialTheme, false);
if (profileThemeToggle) {
    profileThemeToggle.addEventListener('change', () => {
        const next = profileThemeToggle.checked ? 'light' : 'dark';
        try { localStorage.setItem(THEME_KEY, next); } catch {}
        applyTheme(next, true);
    });
}
if (navThemeToggle) {
    navThemeToggle.addEventListener('click', () => {
        const next = selectedTheme === 'light' ? 'dark' : 'light';
        try { localStorage.setItem(THEME_KEY, next); } catch {}
        applyTheme(next, true);
    });
}

// ── Lightweight (performance) mode ───────────────────────────
// The <head> detector already decided the initial mode. Here we
// wire up the warning banner and the profile performance control.
const LITE_KEY = 'spectral_lite';
const LITE_BANNER_KEY = 'spectral_lite_banner_dismissed';
const profileLiteToggle = document.getElementById('profileLiteToggle');
const profileLiteIcon = document.getElementById('profileLiteIcon');
const profileLiteState = document.getElementById('profileLiteState');
const profilePerformanceNote = document.getElementById('profilePerformanceNote');

function updateLiteControl() {
    const on = liteOn();
    if (profileLiteToggle) profileLiteToggle.checked = on;
    if (profileLiteIcon) profileLiteIcon.className = on ? 'fas fa-bolt' : 'fas fa-gauge-high';
    if (profileLiteState) profileLiteState.textContent = on ? 'Optimized rendering is active' : 'Full visual quality';
    const note = profilePerformanceNote && profilePerformanceNote.querySelector('span');
    if (note) note.textContent = on
        ? (window.__SPECTRAL_LITE_AUTO
            ? 'Enabled automatically for this device. Blur, particles and continuous motion are paused.'
            : 'Blur, particles and continuous motion are paused. The page reloads once when this setting changes.')
        : 'Uses the complete visual experience. The page reloads once when this setting changes.';
}

let liteBannerEl = null;
function showLiteBanner() {
    if (liteBannerEl || !liteOn()) return;
    if (!window.__SPECTRAL_LITE_AUTO) return;
    try { if (sessionStorage.getItem(LITE_BANNER_KEY) === '1') return; } catch (e) {}
    const b = document.createElement('div');
    b.className = 'lite-banner';
    b.setAttribute('role', 'status');
    b.innerHTML =
        '<i class="fas fa-feather lite-banner-icon" aria-hidden="true"></i>' +
        '<div class="lite-banner-text"><strong>Облегчённая версия.</strong> ' +
        'Для вашего устройства включён лёгкий режим — меньше нагрузки и без подтормаживаний.</div>' +
        '<div class="lite-banner-actions">' +
            '<button type="button" class="lite-banner-full">Полная версия</button>' +
            '<button type="button" class="lite-banner-close" aria-label="Скрыть"><i class="fas fa-times" aria-hidden="true"></i></button>' +
        '</div>';
    document.body.appendChild(b);
    liteBannerEl = b;
    requestAnimationFrame(() => b.classList.add('show'));
    b.querySelector('.lite-banner-full').addEventListener('click', switchToFull);
    b.querySelector('.lite-banner-close').addEventListener('click', () => {
        try { sessionStorage.setItem(LITE_BANNER_KEY, '1'); } catch (e) {}
        b.classList.remove('show');
        setTimeout(() => { b.remove(); liteBannerEl = null; }, 400);
    });
}

// Live switch to lite mode without a reload (used by the FPS watchdog)
function enableLiteMode(persist, fromWatchdog) {
    document.documentElement.classList.add('lite-mode');
    window.__SPECTRAL_LITE = true;
    if (persist) { try { localStorage.setItem(LITE_KEY, 'on'); } catch (e) {} }
    cancelAnimationFrame(animationId);
    canvasRunning = false;
    resizeCanvas();
    document.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('visible'));
    updateLiteControl();
    showLiteBanner();
    if (fromWatchdog) console.log('%c⚡ Spectral: low FPS detected → switched to the lightweight version', 'color:#f59e0b;font-weight:bold;');
}

// Mode switches reload the page so each version starts from a clean state
function switchToFull() {
    try { localStorage.setItem(LITE_KEY, 'off'); } catch (e) {}
    location.reload();
}
function switchToLite() {
    try { localStorage.setItem(LITE_KEY, 'on'); } catch (e) {}
    try { sessionStorage.setItem(LITE_BANNER_KEY, '1'); } catch (e) {}  // user opted in, don't nag
    location.reload();
}

if (profileLiteToggle) {
    profileLiteToggle.addEventListener('change', () => { profileLiteToggle.checked ? switchToLite() : switchToFull(); });
}
updateLiteControl();
if (liteOn()) showLiteBanner();

// ── Scroll to top ────────────────────────────────────────────
const scrollTopBtn = document.getElementById('scrollToTop');
scrollTopBtn&&scrollTopBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:(liteOn()||REDUCED_MOTION)?'auto':'smooth'}));

// ── Pulsing dot ──────────────────────────────────────────────
const pulseDot = document.querySelector('.pulse-dot');
if(pulseDot&&!liteOn()&&!REDUCED_MOTION) pulseDot.classList.add('motion-pulse');

// ── Parallax ─────────────────────────────────────────────────

// ── Navbar scroll (theme-aware) ──────────────────────────────
const navbar=document.querySelector('.navbar');let lastScroll=0;
let scrollEffectsRaf=null;
function updateScrollEffects(){
    scrollEffectsRaf=null;
    const cur=window.scrollY;
    if(scrollTopBtn) scrollTopBtn.classList.toggle('visible',cur>500);
    if(navbar){
        if(navbar.classList.contains('nav-open')){ lastScroll=cur; return; }
        if(cur>100){
            const delta=cur-lastScroll;
            if(Math.abs(delta)>=8){
                const hiding=delta>0;
                navbar.classList.toggle('is-hidden',hiding);
                navbar.classList.toggle('is-scrolled',!hiding);
                lastScroll=cur;
            }
        }else{
            navbar.classList.remove('is-hidden','is-scrolled');
            lastScroll=cur;
        }
    }else lastScroll=cur;
}
window.addEventListener('scroll',()=>{
    if(!scrollEffectsRaf) scrollEffectsRaf=requestAnimationFrame(updateScrollEffects);
},{passive:true});

// Browsers may apply native fragment scrolling after deferred scripts run.
// SPA route hashes identify sections, so direct routes still open at the top
// with primary navigation visible.
window.addEventListener('load',()=>{
    if(!SITE_ROUTE_IDS.has(location.hash.slice(1)))return;
    window.scrollTo({top:0,behavior:'instant'});
    navbar?.classList.remove('is-hidden','is-scrolled');
    lastScroll=0;
},{once:true});

// ── Mobile hamburger menu ────────────────────────────────────
const navBurger = document.getElementById('navBurger');
const navBackdrop = document.getElementById('navBackdrop');
const navLinksPanel = document.getElementById('primaryNavigation');
function syncNavAccessibility() {
    const compact = window.innerWidth <= 1180;
    const open = Boolean(navbar?.classList.contains('nav-open'));
    if (navLinksPanel) {
        navLinksPanel.setAttribute('aria-hidden', String(compact && !open));
        navLinksPanel.inert = compact && !open;
    }
    if (navBackdrop) navBackdrop.setAttribute('aria-hidden', String(!open));
}
function setNavOpen(open) {
    if (!navbar) return;
    const wasOpen=navbar.classList.contains('nav-open');
    const shouldOpen = open && window.innerWidth <= 1180;
    navbar.classList.toggle('nav-open', shouldOpen);
    document.body.classList.toggle('nav-menu-open', shouldOpen);
    if (navBackdrop) navBackdrop.classList.toggle('show', shouldOpen);
    if (navBurger) {
        navBurger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        navBurger.setAttribute('aria-label', shouldOpen ? 'Close menu' : 'Open menu');
    }
    syncNavAccessibility();
    // make sure the bar is visible when opening
    if (shouldOpen) {
        navbar.classList.remove('is-hidden');
        requestAnimationFrame(()=>navLinksPanel?.querySelector('.nav-btn')?.focus());
    } else if (wasOpen && window.innerWidth <= 1180 && navLinksPanel?.contains(document.activeElement)) {
        navBurger?.focus();
    }
}
if (navBurger) navBurger.addEventListener('click', () => setNavOpen(!navbar.classList.contains('nav-open')));
if (navBackdrop) navBackdrop.addEventListener('click', () => setNavOpen(false));
// close the menu after picking a destination
document.querySelectorAll('.nav-links-container .nav-btn').forEach(btn => {
    btn.addEventListener('click', () => setNavOpen(false));
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navbar?.classList.contains('nav-open') && !topOpenDialog()) {
        setNavOpen(false);
        navBurger?.focus();
    }
});
// auto-close if the viewport grows back to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 1180) setNavOpen(false);
    else syncNavAccessibility();
});
syncNavAccessibility();

// ── Terminal animation ───────────────────────────────────────
// Typewriter terminal: types each line character-by-character with a caret.
let _termTyping=false, _termPlayed=false;
function runTerminal(){
    const body=document.getElementById('terminalBody');
    if(!body||_termTyping||_termPlayed) return;
    const allLines=[...body.querySelectorAll('.t-line')];
    const typed=allLines.filter(l=>l.querySelector('.t-text[data-text]'));
    const cursorLine=body.querySelector('.t-cursorline');
    _termTyping=true; _termPlayed=true;
    allLines.forEach(l=>l.style.opacity='0');
    typed.forEach(l=>{const t=l.querySelector('.t-text');t.textContent='';l.classList.remove('typing');});
    let i=0;
    function typeLine(){
        if(i>=typed.length){ if(cursorLine) cursorLine.style.opacity='1'; _termTyping=false; return; }
        const line=typed[i], el=line.querySelector('.t-text');
        const chars=[...(el.getAttribute('data-text')||'')];  // spread → safe for emoji
        line.style.opacity='1'; line.classList.add('typing');
        const duration=Math.max(280,chars.length*22);
        let start=0,lastCount=-1;
        function typeFrame(ts){
            if(!start) start=ts;
            const progress=Math.min(1,(ts-start)/duration);
            const count=Math.min(chars.length,Math.ceil(progress*chars.length));
            if(count!==lastCount){ el.textContent=chars.slice(0,count).join(''); lastCount=count; }
            if(progress<1) requestAnimationFrame(typeFrame);
            else { line.classList.remove('typing'); i++; setTimeout(typeLine,120); }
        }
        requestAnimationFrame(typeFrame);
    }
    typeLine();
}
// No unobserve → replays each time the console scrolls back into view (flag guards overlap).
const termBody=document.getElementById('terminalBody');
if(termBody){
    if(liteOn()||REDUCED_MOTION){
        termBody.querySelectorAll('.t-line').forEach(line=>line.style.opacity='1');
        termBody.querySelectorAll('.t-text[data-text]').forEach(el=>el.textContent=el.getAttribute('data-text')||'');
    }else{
        const termObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){runTerminal();termObs.unobserve(e.target);}}),{threshold:0.45});
        termObs.observe(termBody);
    }
}

// ── af-bar animation ─────────────────────────────────────────
function fillFeatureBar(fill){
    fill.style.setProperty('--bar-progress',String((Number(fill.getAttribute('data-width'))||0)/100));
    fill.classList.add('is-filled');
}
if(liteOn()||REDUCED_MOTION){
    document.querySelectorAll('.af-bar-fill').forEach(fillFeatureBar);
}else{
    const barObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){requestAnimationFrame(()=>e.target.querySelectorAll('.af-bar-fill').forEach(fillFeatureBar));barObs.unobserve(e.target);}}),{threshold:0.3});
    document.querySelectorAll('.af-showcase').forEach(el=>barObs.observe(el));
}

// ── Counter animation ────────────────────────────────────────
function animCounter(el,target,dur=1100){let start=0,last=-1;function step(ts){if(!start)start=ts;const p=Math.min((ts-start)/dur,1);const value=Math.floor(target*(1-Math.pow(1-p,3)));if(value!==last){el.textContent=String(value);last=value;}if(p<1)requestAnimationFrame(step);else el.textContent=String(target);}requestAnimationFrame(step);}
const cntObs=(liteOn()||REDUCED_MOTION)?null:new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.querySelectorAll('.af-stat-num[data-count]').forEach(el=>animCounter(el,parseInt(el.getAttribute('data-count'))));cntObs.unobserve(e.target);}}),{threshold:0.35});
if(liteOn()||REDUCED_MOTION){
    document.querySelectorAll('.af-stat-num[data-count]').forEach(el=>{const value=parseInt(el.getAttribute('data-count'));el.textContent=value>=1000?(value/1000)+'K+':String(value);});
}else{
    document.querySelectorAll('.af-stats-strip').forEach(el=>cntObs.observe(el));
}

// ── Development explorer ─────────────────────────────────────
const DEV_CODE_NOTES = {
    launch: {
        title: 'Launch orchestration',
        description: 'Turns validated settings and an account into a prepared Minecraft process while keeping failure signals available to the UI.',
        responsibility: 'metadata → arguments → QProcess',
        tasks: ['Build the classpath and game arguments', 'Prepare native libraries', 'Forward output and failures to Console']
    },
    java: {
        title: 'Runtime selection',
        description: 'Matches the Minecraft version to a compatible Java major and chooses the best installed runtime, with download as an explicit fallback.',
        responsibility: 'MC version → Java major → runtime',
        tasks: ['Derive the required Java major', 'Scan installed runtimes', 'Return a compatible, deterministic match']
    },
    auth: {
        title: 'Stable player identity',
        description: 'Keeps local profiles predictable by generating the same vanilla-compatible offline UUID for the same Minecraft username.',
        responsibility: 'username → offline UUID → profile',
        tasks: ['Normalize the OfflinePlayer input', 'Apply the UUID v3 bit layout', 'Keep identity stable between launches']
    }
};

function activateCodeExample(key) {
    if (!DEV_CODE_NOTES[key]) return;
    document.querySelectorAll('.code-tab').forEach(tab => {
        const selected = tab.getAttribute('data-tab') === key;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.setAttribute('tabindex', selected ? '0' : '-1');
    });
    document.querySelectorAll('.code-pane').forEach(pane => {
        const show = pane.getAttribute('data-pane') === key;
        pane.style.display = show ? 'block' : 'none';
        pane.setAttribute('aria-hidden', String(!show));
        if (show) {
            revealUpdatedPanel(pane);
        }
    });
    const note = DEV_CODE_NOTES[key];
    const panel = document.querySelector('.dev-code-notes');
    const title = document.getElementById('devCodeTitle');
    const description = document.getElementById('devCodeDescription');
    const responsibility = document.getElementById('devCodeResponsibility');
    const tasks = document.getElementById('devCodeTasks');
    if (title) title.textContent = note.title;
    if (description) description.textContent = note.description;
    if (responsibility) responsibility.textContent = note.responsibility;
    if (tasks) {
        tasks.replaceChildren(...note.tasks.map(text => {
            const item = document.createElement('li');
            item.textContent = text;
            return item;
        }));
    }
    revealUpdatedPanel(panel);
}

document.querySelectorAll('.code-tab').forEach(tab => {
    tab.addEventListener('click', () => activateCodeExample(tab.getAttribute('data-tab')));
});

const DEV_STAGES = [
    {key:'profile',number:'01',icon:'sliders',accent:'139,124,255',title:'Read the selected profile',description:'Spectral gathers the instance, account, memory, window and launch preferences before touching the game files.',input:'Selected instance + player profile',output:'One validated GameSettings object',insight:'If the wrong instance opens, check the selection and account before changing Java or mods.'},
    {key:'version',number:'02',icon:'cubes-stacked',accent:'76,168,255',title:'Resolve the game version',description:'Version metadata tells the launcher which libraries, assets and inherited settings this instance actually needs.',input:'Minecraft version + instance files',output:'Resolved libraries, assets and metadata',insight:'A missing file or mismatched loader often shows up here. Run Check & Repair and restore a supported version if recommended.'},
    {key:'java',number:'03',icon:'mug-hot',accent:'255,184,77',title:'Match a compatible Java runtime',description:'The required Java major version comes from the selected game build. Spectral looks for a runtime that meets it.',input:'Required Java major version',output:'Compatible Java executable',insight:'If Java cannot be found, check the version requirement and select or install a matching runtime.'},
    {key:'command',number:'04',icon:'list-check',accent:'255,111,207',title:'Assemble the launch command',description:'LauncherCore prepares native files, builds the classpath and passes the right game and JVM arguments to the process.',input:'Resolved files + settings + account',output:'Complete Minecraft command',insight:'A missing native or invalid argument should be diagnosed from the exact command stage, not guessed from the game window.'},
    {key:'result',number:'05',icon:'wave-square',accent:'69,214,181',title:'Observe the running process',description:'QProcess streams output and exit state into Console, so a failure remains inspectable after the game closes.',input:'Minecraft JVM process',output:'Logs, exit code and visible errors',insight:'When asking for help, share the final relevant Console lines and the selected Minecraft and Java versions.'}
];
function activateDevStage(key, focus = false) {
    const index = DEV_STAGES.findIndex(stage => stage.key === key);
    if (index < 0) return;
    const stage = DEV_STAGES[index];
    document.querySelectorAll('[data-dev-stage]').forEach(button => {
        const active = button.dataset.devStage === key;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
    });
    const panel = document.getElementById('devStagePanel');
    if (!panel) return;
    panel.setAttribute('aria-labelledby', document.querySelector(`[data-dev-stage="${key}"]`)?.id || '');
    panel.style.setProperty('--stage-rgb', stage.accent);
    const values = {devStageNumber:stage.number, devStageTitle:stage.title, devStageDescription:stage.description, devStageInput:stage.input, devStageOutput:stage.output, devStageInsight:stage.insight, devStageCounter:`${index+1} of ${DEV_STAGES.length}`, devPipelineProgress:`${stage.number} / 05`};
    Object.entries(values).forEach(([id,value]) => { const node=document.getElementById(id); if(node)node.textContent=value; });
    const icon = document.getElementById('devStageIcon');
    if (icon) icon.className = `fas fa-${stage.icon}`;
    revealUpdatedPanel(panel);
    if (focus) document.querySelector(`[data-dev-stage="${key}"]`)?.focus();
}
document.querySelectorAll('[data-dev-stage]').forEach(button => button.addEventListener('click', () => activateDevStage(button.dataset.devStage)));
document.querySelectorAll('[data-dev-stage]').forEach((button,index) => button.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? DEV_STAGES.length-1 : (index + (['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1) + DEV_STAGES.length) % DEV_STAGES.length;
    activateDevStage(DEV_STAGES[next].key, true);
}));
document.getElementById('devStagePrev')?.addEventListener('click', () => {
    const index=DEV_STAGES.findIndex(stage=>document.querySelector(`[data-dev-stage="${stage.key}"]`)?.classList.contains('active'));
    activateDevStage(DEV_STAGES[(index-1+DEV_STAGES.length)%DEV_STAGES.length].key);
});
document.getElementById('devStageNext')?.addEventListener('click', () => {
    const index=DEV_STAGES.findIndex(stage=>document.querySelector(`[data-dev-stage="${stage.key}"]`)?.classList.contains('active'));
    activateDevStage(DEV_STAGES[(index+1)%DEV_STAGES.length].key);
});

const DEV_SYSTEMS = {
    ui: {
        code: '01', accent: '126, 139, 255', icon: 'window-maximize', title: 'Qt 6 Widgets', kind: 'Presentation',
        description: 'The desktop surface for Play, Library, Accounts, Console, settings and dialog flows, with shared styling and RU / EN translation.',
        owns: 'Tabs · dialogs · interaction', connects: 'LauncherCore · managers',
        tags: ['QWidget', 'Signals', 'Qt Linguist'], flow: ['Player action', 'Qt event', 'LauncherCore'],
        tasks: ['Keeps product surfaces visually consistent', 'Translates state into clear player actions', 'Delivers accessible feedback and dialogs']
    },
    core: {
        code: '02', accent: '91, 174, 255', icon: 'code', title: 'Launcher Core', kind: 'Orchestration',
        description: 'Coordinates launch preparation, builds the final Minecraft command and owns the QProcess lifecycle exposed to the interface.',
        owns: 'Arguments · process state', connects: 'UI · Java · version data',
        tags: ['C++17', 'QProcess', 'Signals'], flow: ['GameSettings', 'LauncherCore', 'Minecraft JVM'],
        tasks: ['Builds the classpath and game arguments', 'Prepares native libraries before launch', 'Emits output, state and real failure signals']
    },
    java: {
        code: '03', accent: '240, 180, 77', icon: 'mug-hot', title: 'Java Manager', kind: 'Runtime',
        description: 'Discovers installed Java runtimes and matches them to the major version required by the selected Minecraft metadata.',
        owns: 'Discovery · compatibility', connects: 'Version metadata · LauncherCore',
        tags: ['Java major', 'Runtime scan', 'Fallback'], flow: ['Version JSON', 'JavaManager', 'Java path'],
        tasks: ['Scans available Java installations', 'Selects by required major version', 'Supports an explicit runtime download path']
    },
    content: {
        code: '04', accent: '91, 207, 166', icon: 'box-open', title: 'Versions & Mods', kind: 'Content',
        description: 'Installs Minecraft versions and manages instance content, including Modrinth discovery, version files and compatible mod updates.',
        owns: 'Versions · mods · assets', connects: 'Modrinth · instance library',
        tags: ['Modrinth', 'Version JSON', 'Updates'], flow: ['Catalog', 'Content manager', 'Instance files'],
        tasks: ['Resolves inherited version metadata', 'Keeps every instance isolated', 'Tracks installed content and available updates']
    },
    accounts: {
        code: '05', accent: '222, 113, 174', icon: 'user-shield', title: 'Accounts', kind: 'Identity',
        description: 'Manages local Minecraft profiles, stable offline UUIDs, skin previews and quick account switching for each launch.',
        owns: 'Profiles · UUIDs · skins', connects: 'UI · launch settings',
        tags: ['Offline UUID', 'Skins', 'Profiles'], flow: ['Username', 'Account model', 'Launch identity'],
        tasks: ['Keeps identity stable between sessions', 'Provides the active launch account', 'Separates profile data from instance data']
    },
    diagnostics: {
        code: '06', accent: '73, 205, 213', icon: 'terminal', title: 'Console & Logs', kind: 'Observability',
        description: 'Makes the launch process inspectable with timestamps, severity colors, filters, search, copy, export and crash-focused errors.',
        owns: 'Output · filters · export', connects: 'QProcess · launcher signals',
        tags: ['stdout', 'stderr', 'Export'], flow: ['QProcess', 'Log stream', 'Visible error'],
        tasks: ['Shows stdout and stderr in context', 'Keeps the exact failure reason visible', 'Supports fast search and log sharing']
    }
};

function activateDevSystem(key, focusPanel = false) {
    const system = DEV_SYSTEMS[key];
    if (!system) return;
    document.querySelectorAll('[data-dev-system]').forEach(button => {
        const selected = button.getAttribute('data-dev-system') === key;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-selected', String(selected));
        button.setAttribute('tabindex', selected ? '0' : '-1');
    });
    const icon = document.querySelector('#devSystemIcon i');
    const title = document.getElementById('devSystemTitle');
    const kind = document.getElementById('devSystemKind');
    const description = document.getElementById('devSystemDescription');
    const owns = document.getElementById('devSystemOwns');
    const connects = document.getElementById('devSystemConnects');
    const tasks = document.getElementById('devSystemTasks');
    const tags = document.getElementById('devSystemTags');
    const flowInput = document.getElementById('devSystemFlowInput');
    const flowCore = document.getElementById('devSystemFlowCore');
    const flowOutput = document.getElementById('devSystemFlowOutput');
    if (icon) icon.className = `fas fa-${system.icon}`;
    if (title) title.textContent = system.title;
    if (kind) kind.textContent = system.kind;
    if (description) description.textContent = system.description;
    if (owns) owns.textContent = system.owns;
    if (connects) connects.textContent = system.connects;
    if (tags) {
        tags.replaceChildren(...system.tags.map(text => {
            const tag = document.createElement('span');
            tag.textContent = text;
            return tag;
        }));
    }
    if (flowInput) flowInput.textContent = system.flow[0];
    if (flowCore) flowCore.textContent = system.flow[1];
    if (flowOutput) flowOutput.textContent = system.flow[2];
    if (tasks) {
        tasks.replaceChildren(...system.tasks.map(text => {
            const item = document.createElement('li');
            const tick = document.createElement('i');
            tick.className = 'fas fa-check';
            item.append(tick, document.createTextNode(text));
            return item;
        }));
    }
    const panel = document.querySelector('.dev-system-panel');
    if (panel) {
        panel.dataset.systemCode = system.code;
        const number = document.getElementById('devSystemNumber');
        if (number) number.textContent = system.code;
        document.querySelectorAll('[data-layer-node]').forEach(node => node.classList.toggle('active', node.dataset.layerNode === key));
        const activeTab = document.querySelector(`[data-dev-system="${key}"]`);
        if (activeTab?.id) panel.setAttribute('aria-labelledby', activeTab.id);
        panel.style.setProperty('--system-rgb', system.accent);
        revealUpdatedPanel(panel.querySelector('.dev-system-content'));
        if (focusPanel && window.innerWidth <= 560) panel.scrollIntoView({ behavior: (REDUCED_MOTION || liteOn()) ? 'auto' : 'smooth', block: 'nearest' });
    }
}

document.querySelectorAll('[data-dev-system]').forEach(button => {
    button.addEventListener('click', () => activateDevSystem(button.getAttribute('data-dev-system'), true));
});
document.querySelectorAll('[data-layer-node]').forEach(button => button.addEventListener('click', () => activateDevSystem(button.dataset.layerNode)));

document.querySelectorAll('[data-dev-target]').forEach(button => {
    button.addEventListener('click', () => {
        const target = document.querySelector(`.nav-links-container [data-target="${button.getAttribute('data-dev-target')}"]`);
        if (target) target.click();
    });
});

function scrollBelowNavbar(target, extraGap = 18) {
    if (!target) return;
    const navbar = document.querySelector('.navbar');
    const navbarHeight = navbar ? Math.ceil(navbar.getBoundingClientRect().height) : 0;
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - navbarHeight - extraGap);
    window.scrollTo({
        top,
        behavior: (liteOn() || REDUCED_MOTION) ? 'auto' : 'smooth'
    });
}
document.querySelectorAll('.dev-document-index a[href^="#dev-"]').forEach(link=>link.addEventListener('click',event=>{
    const id=link.getAttribute('href').slice(1);
    const target=document.getElementById(id);
    if(!target)return;
    event.preventDefault();
    history.pushState(null,'',`#${id}`);
    scrollBelowNavbar(target);
}));

document.querySelectorAll('[data-dev-scroll]').forEach(button => {
    button.addEventListener('click', () => {
        const target = document.getElementById(button.getAttribute('data-dev-scroll'));
        scrollBelowNavbar(target);
    });
});

function enableHorizontalTabKeys(selector) {
    const tabs = [...document.querySelectorAll(selector)];
    tabs.forEach((tab, index) => {
        tab.addEventListener('keydown', event => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const step = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
            const next = tabs[event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + step + tabs.length) % tabs.length];
            next.focus();
            next.click();
        });
    });
}
enableHorizontalTabKeys('[data-dev-system]');
enableHorizontalTabKeys('.code-tab');

// Code editor appearance: play the reveal on the active pane the first time it scrolls into view.
const codeEditorEl=document.querySelector('.code-editor');
if(codeEditorEl){
    if(liteOn()){
        codeEditorEl.querySelector('.code-pane.active')?.classList.add('code-pane--in');
    }else{
        const ceObs=new IntersectionObserver(entries=>entries.forEach(e=>{
            if(!e.isIntersecting) return;
            const at=document.querySelector('.code-tab.active');
            const dp=at?at.getAttribute('data-tab'):null;
            const pane=dp?document.querySelector(`.code-pane[data-pane="${dp}"]`):document.querySelector('.code-pane');
            if(pane){ pane.classList.remove('code-pane--in'); void pane.offsetWidth; pane.classList.add('code-pane--in'); }
            ceObs.unobserve(e.target);
        }),{threshold:0.35});
        ceObs.observe(codeEditorEl);
    }
}

// ── Lightweight toast ────────────────────────────────────────
function showToast(msg, icon='circle-info'){
    let host=document.getElementById('toastHost');
    if(!host){host=document.createElement('div');host.id='toastHost';host.className='toast-host';host.setAttribute('role','status');host.setAttribute('aria-live','polite');host.setAttribute('aria-atomic','false');document.body.appendChild(host);}
    const t=document.createElement('div');t.className='toast';
    t.innerHTML=`<i class="fas fa-${icon}"></i><span></span>`;
    t.querySelector('span').textContent=msg;
    host.appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),420);},3800);
}

// ── FAQ accordion — smooth scrollHeight-based ────────────────
document.querySelectorAll('#faqList .faq-q').forEach((q,index) => {
    const answer=q.closest('.faq-item')?.querySelector('.faq-a');
    if(!q.id)q.id=`faqQuestion${index+1}`;
    if(answer){if(!answer.id)answer.id=`faqAnswer${index+1}`;q.setAttribute('aria-controls',answer.id);answer.setAttribute('role','region');answer.setAttribute('aria-labelledby',q.id);}
    q.setAttribute('aria-expanded', String(q.closest('.faq-item')?.classList.contains('open')));
    q.addEventListener('click', () => {
        const item = q.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('#faqList .faq-item').forEach(i => {
            if (i !== item) {
                i.classList.remove('open');
                i.querySelector('.faq-q')?.setAttribute('aria-expanded','false');
            }
        });
        item.classList.toggle('open', !isOpen);
        q.setAttribute('aria-expanded', String(!isOpen));
    });
});
// ══════════════════════════════════════════════════════════════
// STORAGE KEYS
// ══════════════════════════════════════════════════════════════
// Support diagnostic workspace: one symptom drives one focused solution.
const supportFixButtons=[...document.querySelectorAll('[data-support-fix]')];
const supportFixPanels=[...document.querySelectorAll('[data-support-panel]')];
function activateSupportFix(key){
    if(!key)return;
    const briefIssue=document.getElementById('supportBriefIssue');
    const issueForFix={crash:'Game crashes or freezes',loader:'Fabric or Forge fails',performance:'Low FPS or stutter',account:'Account or offline play'};
    if(briefIssue && issueForFix[key]) { briefIssue.value=issueForFix[key]; window.SpectralControls?.refresh(); updateSupportBrief(); }
    supportFixButtons.forEach(button=>{
        const active=button.dataset.supportFix===key;
        button.classList.toggle('active',active);
        button.setAttribute('aria-selected',String(active));
        button.tabIndex=active?0:-1;
    });
    supportFixPanels.forEach(panel=>{
        const active=panel.dataset.supportPanel===key;
        panel.hidden=!active;
        panel.classList.toggle('active',active);
    });
    updateSupportChecklist();
}
function updateSupportChecklist(){
    const panel=supportFixPanels.find(item=>!item.hidden);
    const checks=[...(panel?.querySelectorAll('.support-checklist input')||[])];
    const done=checks.filter(check=>check.checked).length;
    const count=document.getElementById('supportChecklistCount');
    const fill=document.getElementById('supportProgressFill');
    if(count)count.textContent=`${done} / ${checks.length}`;
    if(fill)fill.style.transform=`scaleX(${checks.length?done/checks.length:0})`;
    panel?.classList.toggle('is-complete',done===checks.length&&checks.length>0);
}
supportFixButtons.forEach(button=>{
    button.addEventListener('click',()=>activateSupportFix(button.dataset.supportFix));
    button.addEventListener('keydown',event=>{
        if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
        event.preventDefault();
        const step=['ArrowDown','ArrowRight'].includes(event.key)?1:-1;
        const available=supportFixButtons.filter(item=>!item.classList.contains('is-filtered-out'));
        const current=available.indexOf(button);
        const next=available[(current+step+available.length)%available.length];
        if(next){activateSupportFix(next.dataset.supportFix);next.focus();}
    });
});
if(supportFixButtons.length)activateSupportFix(supportFixButtons.find(button=>button.classList.contains('active'))?.dataset.supportFix||supportFixButtons[0].dataset.supportFix);
document.querySelectorAll('.support-checklist input').forEach(check=>check.addEventListener('change',updateSupportChecklist));
document.querySelectorAll('.support-reset-checks').forEach(button=>button.addEventListener('click',()=>{
    button.closest('[data-support-panel]')?.querySelectorAll('.support-checklist input').forEach(check=>{check.checked=false;});
    updateSupportChecklist();
}));
document.querySelectorAll('[data-support-jump]').forEach(button=>button.addEventListener('click',()=>scrollBelowNavbar(document.getElementById(button.dataset.supportJump))));

const supportSearchInput=document.getElementById('supportSearchInput');
const supportSearchStatus=document.getElementById('supportSearchStatus');
const supportActionButtons=[...document.querySelectorAll('.support-fix-actions [data-support-question]')];
const supportTopicButtons=[...document.querySelectorAll('.support-topic-strip [data-support-topic]')];
let activeSupportTopic='all';
function filterSupportKnowledge(){
    const query=(supportSearchInput?.value||'').trim().toLowerCase();
    const faqItems=[...document.querySelectorAll('#faqList .faq-item')];
    let faqMatches=0;
    faqItems.forEach(item=>{
        const match=(!query||item.textContent.toLowerCase().includes(query))&&(activeSupportTopic==='all'||item.dataset.supportTopic===activeSupportTopic);
        item.classList.toggle('is-filtered-out',!match);
        if(match)faqMatches++;
    });
    supportActionButtons.forEach(button=>{
        const match=!query||button.textContent.toLowerCase().includes(query);
        button.classList.toggle('is-filtered-out',!match);
    });
    supportFixButtons.forEach(button=>{
        const panel=document.querySelector(`[data-support-panel="${button.dataset.supportFix}"]`);
        const match=!query||`${button.textContent} ${panel?.textContent||''}`.toLowerCase().includes(query);
        button.classList.toggle('is-filtered-out',!match);
    });
    const visibleFix=supportFixButtons.find(button=>!button.classList.contains('is-filtered-out'));
    const activeFix=supportFixButtons.find(button=>button.classList.contains('active'));
    const faqVisibleCount=document.getElementById('faqVisibleCount');
    const supportNoResults=document.getElementById('supportNoResults');
    const faqList=document.getElementById('faqList');
    const isRussian=window.SpectralI18n?.getLanguage()==='ru';
    const guideLabel=isRussian
        ? `${faqMatches} ${faqMatches%10===1&&faqMatches%100!==11?'руководство':faqMatches%10>=2&&faqMatches%10<=4&&(faqMatches%100<12||faqMatches%100>14)?'руководства':'руководств'}`
        : `${faqMatches} ${faqMatches===1?'guide':'guides'}`;
    if(faqVisibleCount)faqVisibleCount.textContent=guideLabel;
    if(supportNoResults)supportNoResults.hidden=faqMatches>0;
    faqList?.classList.toggle('is-empty',faqMatches===0);
    document.querySelector('.support-diagnostic-workspace')?.classList.toggle('no-diagnostic-match',!visibleFix);
    if(visibleFix&&activeFix?.classList.contains('is-filtered-out'))activateSupportFix(visibleFix.dataset.supportFix);
    if(supportSearchStatus){
        const topic=isRussian?({accounts:'аккаунты',launch:'запуск',mods:'моды',performance:'производительность'}[activeSupportTopic]||activeSupportTopic):activeSupportTopic;
        supportSearchStatus.textContent=isRussian
            ? `${guideLabel}${activeSupportTopic==='all'?(query?' найдено':` и ${supportActionButtons.length+supportFixButtons.length} пошаговых проверок`):` в разделе «${topic}»`}`
            : query
                ? `${guideLabel} found${activeSupportTopic==='all'?'':` in ${topic}`}`
                : `${guideLabel}${activeSupportTopic==='all'?` and ${supportActionButtons.length+supportFixButtons.length} guided checks`:` in ${topic}`}`;
    }
}
supportSearchInput?.addEventListener('input',filterSupportKnowledge);
document.addEventListener('spectral:languagechange',filterSupportKnowledge);
supportTopicButtons.forEach(button=>button.addEventListener('click',()=>{
    activeSupportTopic=button.dataset.supportTopic;
    supportTopicButtons.forEach(item=>{
        const active=item===button;
        item.classList.toggle('active',active);
        item.setAttribute('aria-pressed',String(active));
    });
    filterSupportKnowledge();
}));
document.addEventListener('keydown',event=>{
    if(event.key!=='/'||event.ctrlKey||event.metaKey||event.altKey)return;
    const target=event.target;
    if(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target?.isContentEditable)return;
    const supportTab=document.getElementById('support');
    if(!supportTab?.classList.contains('active-tab'))return;
    event.preventDefault();supportSearchInput?.focus();
});
document.querySelectorAll('[data-support-question]').forEach(button=>button.addEventListener('click',()=>{
    const query=(button.dataset.supportQuestion||'').toLowerCase();
    if(supportSearchInput){supportSearchInput.value='';filterSupportKnowledge();}
    const item=[...document.querySelectorAll('#faqList .faq-item')].find(entry=>entry.textContent.toLowerCase().includes(query));
    if(!item){showToast('Open the Console guide for the full diagnostic path','circle-info');return;}
    if(!item.classList.contains('open'))item.querySelector('.faq-q')?.click();
    const scrollTarget=window.innerWidth>=900?item.closest('.support-knowledge-studio'):item;
    requestAnimationFrame(()=>scrollBelowNavbar(scrollTarget));
}));
document.querySelectorAll('[data-support-guide]').forEach(button=>button.addEventListener('click',()=>{
    const item=document.querySelector(`#faqList [data-support-id="${button.dataset.supportGuide}"]`);
    if(!item)return;
    if(supportSearchInput)supportSearchInput.value='';
    activeSupportTopic='all';
    supportTopicButtons.forEach(topic=>{
        const active=topic.dataset.supportTopic==='all';
        topic.classList.toggle('active',active);
        topic.setAttribute('aria-pressed',String(active));
    });
    filterSupportKnowledge();
    if(!item.classList.contains('open'))item.querySelector('.faq-q')?.click();
    requestAnimationFrame(()=>scrollBelowNavbar(item));
}));

// The support note stays local until the visitor explicitly copies it.
const supportBriefForm=document.getElementById('supportBriefForm');
function buildSupportBrief(){
    const value=id=>document.getElementById(id)?.value.trim()||'';
    const label=text=>window.SpectralI18n?.getLanguage()==='ru'?window.SpectralI18n.translate(text):text;
    return [
        label('Spectral support note'),
        `${label('Issue')}: ${label(value('supportBriefIssue'))}`,
        `${label('Minecraft version')}: ${value('supportBriefVersion')||label('Not provided')}`,
        `${label('Java version')}: ${value('supportBriefJava')||label('Not provided')}`,
        `${label('Error or observation')}: ${value('supportBriefError')||label('Not provided')}`
    ].join('\n');
}
function updateSupportBrief(){
    const preview=document.getElementById('supportBriefPreview');
    if(preview)preview.textContent=buildSupportBrief();
    const status=document.getElementById('supportBriefStatus');
    if(status)status.textContent='';
}
supportBriefForm?.addEventListener('input',updateSupportBrief);
supportBriefForm?.addEventListener('change',updateSupportBrief);
supportBriefForm?.addEventListener('reset',()=>requestAnimationFrame(updateSupportBrief));
document.addEventListener('spectral:languagechange',updateSupportBrief);
document.getElementById('supportBriefCopy')?.addEventListener('click',async()=>{
    const status=document.getElementById('supportBriefStatus');
    try {
        await navigator.clipboard.writeText(buildSupportBrief());
        if(status)status.textContent='Copied. Review it before sharing.';
    } catch {
        if(status)status.textContent='Copy unavailable here. Select the preview text instead.';
        window.getSelection()?.selectAllChildren(document.getElementById('supportBriefPreview'));
    }
});
updateSupportBrief();

const K_USERS   = 'spectral_site_users';
const K_SESSION = 'spectral_site_session';
const K_MC_PFX  = 'spectral_launcher_';
const K_MC_ACT  = 'spectral_mc_active_';
const K_FORUM   = 'spectral_forum';
const K_NEWS    = 'spectral_news';
const K_FRIENDS = 'spectral_friends';
const K_ROLE_ORDERS = 'spectral_role_orders';
const K_PROFILE_STYLES = 'spectral_profile_styles';
const K_DEV_ROLE_PREVIEWS = 'spectral_dev_role_previews';

// CSP-compatible image fallback handling for static and dynamically rendered
// images. Inline event-handler attributes are intentionally not used.
document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (image.hasAttribute('data-hide-on-error')) {
        image.hidden = true;
        const fallbackIcon = image.nextElementSibling;
        if (fallbackIcon instanceof HTMLElement) fallbackIcon.style.display = 'flex';
        return;
    }
    if (image.hasAttribute('data-avatar-fallback') && image.dataset.fallbackApplied !== 'true') {
        image.dataset.fallbackApplied = 'true';
        image.src = 'assets/avatar-placeholder.svg';
    }
}, true);

// ── Optional Supabase authentication + owner-scoped sync ─────
// The project URL and publishable key identify the browser client. Table access
// must be protected by the RLS policies in supabase/security_hardening.sql.
const SUPABASE_URL = document.querySelector('meta[name="spectral-supabase-url"]')?.content.trim() || '';
const SUPABASE_PUBLIC_KEY = document.querySelector('meta[name="spectral-supabase-publishable-key"]')?.content.trim()
    || document.querySelector('meta[name="spectral-supabase-anon-key"]')?.content.trim() || '';
const SUPABASE_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.0/dist/umd/supabase.min.js';
const SUPABASE_SCRIPT_INTEGRITY = 'sha384-De+l/Df7qym5QBDVocD3+gW1S7IjR3epf+6KbRDjB3FCCzM/LqVTwqckT6FhFar8';
let cloud = null;
let cloudAuthUserId = null;

function validSupabaseConfig() {
    if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) return false;
    try {
        const url = new URL(SUPABASE_URL);
        return url.protocol === 'https:'
            && /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname)
            && (/^sb_publishable_[A-Za-z0-9_-]+$/.test(SUPABASE_PUBLIC_KEY)
                || /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(SUPABASE_PUBLIC_KEY));
    } catch {
        return false;
    }
}

async function loadSupabaseLibrary() {
    if (window.supabase?.createClient) return;
    await new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${SUPABASE_SCRIPT_URL}"]`);
        if (existing) {
            existing.addEventListener('load', resolve, { once:true });
            existing.addEventListener('error', () => reject(new Error('Authentication library unavailable')), { once:true });
            return;
        }
        const script = document.createElement('script');
        script.src = SUPABASE_SCRIPT_URL;
        script.integrity = SUPABASE_SCRIPT_INTEGRITY;
        script.crossOrigin = 'anonymous';
        script.referrerPolicy = 'no-referrer';
        script.addEventListener('load', resolve, { once:true });
        script.addEventListener('error', () => reject(new Error('Authentication library unavailable')), { once:true });
        document.head.appendChild(script);
    });
}

async function initCloudClient() {
    if (cloud) return cloud;
    if (!validSupabaseConfig()) return null;
    try {
        await loadSupabaseLibrary();
        cloud = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
            auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
        });
        return cloud;
    } catch (error) {
        console.warn('[auth] Optional cloud connection is unavailable; local data remains available.');
        return null;
    }
}
// While true, local writes are NOT pushed back to the cloud (used during the
// initial load so freshly-downloaded data is not echoed straight back up).
let cloudSyncing = false;
let cloudRetryAfter = 0;
let cloudNetworkWarningShown = false;
function cloudReady() {
    return Boolean(cloud && cloudAuthUserId && !cloudSyncing && navigator.onLine !== false && Date.now() >= cloudRetryAfter);
}
function handleCloudError(area, error) {
    const message = error?.message || String(error || 'Unknown cloud error');
    if (/failed to fetch|network|load failed/i.test(message)) {
        cloudRetryAfter = Date.now() + 5 * 60 * 1000;
        if (!cloudNetworkWarningShown) {
            cloudNetworkWarningShown = true;
            console.warn('[cloud] offline — local data remains available; sync will retry later.');
        }
        return;
    }
    console.warn(`[cloud] ${area}:`, message);
}
window.addEventListener('online', () => {
    cloudRetryAfter = 0;
    cloudNetworkWarningShown = false;
});

// ── Censorship ───────────────────────────────────────────────
const BANNED = ['fuck','shit','ass','bitch','bastard','crap','dick','cock','nigga',
    'блядь','блять','сука','пиздец','пизда','хуй','хуйня','ебать','ебал','залупа',
    'мудак','долбоёб','шлюха','пидор','ублюдок','ёбаный','похуй','нихуя','заебал'];
function censor(text) {
    let r = text;
    BANNED.forEach(w => { r = r.replace(new RegExp(w, 'gi'), '*'.repeat(w.length)); });
    return r;
}

// ── XSS protection ───────────────────────────────────────────
// Escape any user-controlled string before it is placed into innerHTML
// (both text and attribute contexts). Prevents stored XSS via forum posts,
// display names, bios, profile usernames and news entries.
function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}
// Strip control chars and clamp length for stored fields
function sanitizeField(s, max) {
    return String(s == null ? '' : s).replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, max || 200);
}

function safeIdentifier(value, fallback = '') {
    const normalized = String(value == null ? '' : value).trim();
    return /^[A-Za-z0-9_-]{1,64}$/.test(normalized) ? normalized : fallback;
}

const AVATAR_DATA_RE = /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/i;
function safeAvatarUrl(value, fallback = '') {
    const candidate = String(value == null ? '' : value).trim();
    if (!candidate) return fallback;
    if (candidate.length <= 1_500_000 && AVATAR_DATA_RE.test(candidate)) return candidate;
    try {
        const url = new URL(candidate);
        const allowedHost = url.hostname === 'minotar.net'
            || url.hostname === 'lh3.googleusercontent.com'
            || url.hostname.endsWith('.googleusercontent.com');
        if (url.protocol === 'https:' && !url.username && !url.password && allowedHost) return url.href;
    } catch {}
    return fallback;
}

// ── Password hashing ─────────────────────────────────────────
// Passwords are never stored in plaintext. Hashed with SHA-256 (+ a fixed
// pepper) via the Web Crypto API, with a clearly-weaker fallback if Web Crypto
// is unavailable. NOTE: client-side hashing only prevents plaintext exposure in
// localStorage / password reuse — it is NOT a substitute for server-side auth.
const PW_PEPPER = 'spectral_pepper_v1:';
async function hashPassword(pw) {
    const data = new TextEncoder().encode(PW_PEPPER + pw);
    try {
        if (window.crypto && crypto.subtle) {
            const buf = await crypto.subtle.digest('SHA-256', data);
            return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
        }
    } catch {}
    // Fallback: non-cryptographic double-FNV (only used without Web Crypto)
    let h1 = 0x811c9dc5 >>> 0, h2 = 0x01234567 >>> 0;
    const s = PW_PEPPER + pw;
    for (let i = 0; i < s.length; i++) {
        h1 = Math.imul(h1 ^ s.charCodeAt(i), 0x01000193) >>> 0;
        h2 = Math.imul(h2 ^ s.charCodeAt(i), 0x85ebca77) >>> 0;
    }
    return 'w' + h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}
function looksHashed(s) { return /^[a-f0-9]{64}$/.test(s) || /^w[a-f0-9]{16}$/.test(s); }
// ══════════════════════════════════════════════════════════════
// SITE USERS (two-tier system)
// ══════════════════════════════════════════════════════════════
const LOCAL_DEVELOPMENT_ORIGIN = location.protocol === 'file:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const LOCAL_OWNER_PASSWORD = LOCAL_DEVELOPMENT_ORIGIN && !validSupabaseConfig() ? 'devpass' : '';
const DEFAULT_SITE_USERS = [
    { id:'su_dev', username:'_kaiserr_',  password:LOCAL_OWNER_PASSWORD, role:'DEV',       displayName:'_kaiserr_',  bio:'Developer of Spectral',    avatar:'', registeredAt:'01.01.2026', totalTimeSec:154800, visitCount:212, lastSeen:'2026-06-28T09:10:00Z', banned:false },
    { id:'su_adm', username:'Console',    password:'', role:'ADMIN',     displayName:'Console',    bio:'Keeping the servers tidy', avatar:'', registeredAt:'10.02.2024', totalTimeSec:98400,  visitCount:140, lastSeen:'2026-06-27T20:00:00Z', banned:false },
    { id:'su_mod', username:'Redstone',   password:'', role:'MODERATOR', displayName:'Redstone',   bio:'Forum moderator',          avatar:'', registeredAt:'05.03.2024', totalTimeSec:61200,  visitCount:97,  lastSeen:'2026-06-26T14:30:00Z', banned:false },
    { id:'su_pro', username:'Steve_Pro',  password:'', role:'PRO',       displayName:'Steve_Pro',  bio:'Minecraft enthusiast',     avatar:'', registeredAt:'15.01.2024', totalTimeSec:45720,  visitCount:64,  lastSeen:'2026-06-25T11:00:00Z', banned:false },
    { id:'su_vet', username:'Enderman42', password:'', role:'VETERAN',   displayName:'Enderman42', bio:'Been here since day one',  avatar:'', registeredAt:'22.04.2024', totalTimeSec:23400,  visitCount:38,  lastSeen:'2026-06-20T18:45:00Z', banned:false },
    { id:'su_usr', username:'Alex',       password:'', role:'USER',      displayName:'Alex',       bio:'Builder',                  avatar:'', registeredAt:'20.02.2024', totalTimeSec:7200,   visitCount:12,  lastSeen:'2026-06-12T08:20:00Z', banned:false }
];
const DEFAULT_MC_ACCOUNTS = {
    'su_dev': [
        { id:'la_d1', username:'_kaiserr_', type:'elyby',     addedAt:'01.01.2026', playtime:'0h',   favorite:false, uuid:offlineUuid('_kaiserr_'), lastUsed:null }
    ],
    'su_pro': [
        { id:'la_p1', username:'Steve_Pro',  type:'offline', addedAt:'15.01.2024', playtime:'127h', favorite:false, uuid:offlineUuid('Steve_Pro'),  lastUsed:null },
        { id:'la_p2', username:'Enderman42', type:'offline',   addedAt:'20.04.2024', playtime:'23h',  favorite:true,  uuid:offlineUuid('Enderman42'), lastUsed:null }
    ],
    'su_usr': [
        { id:'la_u1', username:'Alex',       type:'elyby',     addedAt:'20.02.2024', playtime:'43h',  favorite:false, uuid:offlineUuid('Alex'),       lastUsed:null }
    ],
    'su_adm': [
        { id:'la_a1', username:'Console',    type:'offline', addedAt:'10.02.2024', playtime:'88h',  favorite:false, uuid:offlineUuid('Console'),    lastUsed:null }
    ],
    'su_mod': [
        { id:'la_m1', username:'Redstone',   type:'offline', addedAt:'05.03.2024', playtime:'54h',  favorite:true,  uuid:offlineUuid('Redstone'),   lastUsed:null },
        { id:'la_m2', username:'TorchBearer',type:'offline',   addedAt:'06.03.2024', playtime:'9h',   favorite:false, uuid:offlineUuid('TorchBearer'),lastUsed:null }
    ],
    'su_vet': [
        { id:'la_v1', username:'Enderman42', type:'elyby',     addedAt:'22.04.2024', playtime:'31h',  favorite:false, uuid:offlineUuid('Enderman42'), lastUsed:null }
    ]
};
const DEFAULT_FORUM = [
    { id:'fp_1', authorId:'su_pro', authorName:'Steve_Pro', title:'Add 3D skin preview in launcher',
      text:'It would be great to see a 3D skin preview in the Accounts tab, similar to NameMC. Would make it much easier to see how your skin looks before launching.',
      date:'25.06.2026', upvotes:['su_usr'], approved:true, rejected:false },
    { id:'fp_2', authorId:'su_usr', authorName:'Alex', title:'Dark/Light theme toggle',
      text:'Please add an option to switch between dark and light themes. Some players prefer a lighter interface when playing during the day.',
      date:'24.06.2026', upvotes:['su_pro','su_dev'], approved:true, rejected:false }
];
// Friendships between SITE users. Each row is one relationship:
//   requester  -> the user who sent the request
//   addressee  -> the user who received it
//   status     -> 'pending' (awaiting acceptance) | 'accepted' (friends)
// A pair of users has at most one row. Seed a few so the feature isn't empty.
const DEFAULT_FRIENDS = [
    { id:'fr_seed1', requester:'su_pro', addressee:'su_usr', status:'accepted', createdAt:'2026-06-20T10:00:00Z' },
    { id:'fr_seed2', requester:'su_mod', addressee:'su_pro', status:'accepted', createdAt:'2026-06-22T14:30:00Z' },
    { id:'fr_seed3', requester:'su_vet', addressee:'su_usr', status:'pending',  createdAt:'2026-06-27T09:15:00Z' }
];
const DEFAULT_NEWS = [
    { id:'news_feature_recovery_199', date:'Oct 9, 2026', title:'Check, Restore & Understand Crashes', version:'v1.9.9', channel:'stable', icon:'shield-halved', summary:'The Play tab now gives a clearer path from a failed launch to a file check, a copyable report and a likely cause.', isCurrent:true, dimmed:false, items:[
        {type:'add',text:'Check & Repair inspects the selected build’s version files, Java, libraries and assets without launching the game'},
        {type:'imp',text:'When a supported Vanilla, Fabric, Forge or Quilt version needs repair, the launcher can restore files and repeat the check'},
        {type:'add',text:'Crash analysis combines process output, crash reports and hs_err_pid files to suggest likely causes and next steps'},
        {type:'imp',text:'Diagnostic reports can be copied for support while worlds and personal mods stay in their build folders'}
    ]},
    { id:'news_feature_site_profiles_23', date:'Oct 2, 2026', title:'A Clearer Home for Profiles & Friends', version:'Website 2.3', channel:'website', icon:'globe', summary:'The site brings game profile details, role-based slots and the friend network into one account workspace.', isCurrent:false, dimmed:false, items:[
        {type:'imp',text:'The account page makes the selected game profile, UUID and available profile slots easier to inspect'},
        {type:'add',text:'Friend requests, player search and profile links are grouped around the signed-in Spectral account'},
        {type:'imp',text:'Profile copy explains that Ely.by authorization remains on the computer running the launcher'}
    ]},
    { id:'news_feature_updater_198', date:'Sep 27, 2026', title:'Updates with a Verifiable Package', version:'v1.9.8', channel:'stable', icon:'bolt', summary:'Launcher updates now explain what changed and require a suitable package with a matching SHA-256 checksum.', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'Spectral checks GitHub Releases at startup and offers a manual check under Settings → General → About'},
        {type:'imp',text:'Available updates show release notes before installation and offer a restart afterward'},
        {type:'fix',text:'An update is offered only when a newer release has a compatible package and a verifiable SHA-256 checksum'}
    ]},
    { id:'news_feature_mods_197', date:'Sep 18, 2026', title:'More Control over Modrinth Content', version:'v1.9.7', channel:'stable', icon:'puzzle-piece', summary:'Mod discovery and updates stay tied to the build’s Minecraft version and loader instead of treating every file as interchangeable.', isCurrent:false, dimmed:false, items:[
        {type:'imp',text:'Discover compatible mods, resource packs and shaders from inside a build’s Content view'},
        {type:'add',text:'Required dependencies can be offered during installation; Auto-libraries can download missing ones automatically'},
        {type:'add',text:'Mod update checks retain disabled state, show update history and can be enabled separately for each build'},
        {type:'imp',text:'Local files without a matching Modrinth project or compatible release remain under the player’s control'}
    ]},
    { id:'news_feature_modpacks_196', date:'Sep 6, 2026', title:'From Modrinth Pack to New Build', version:'v1.9.6', channel:'stable', icon:'cubes', summary:'A Modrinth search result or .mrpack file can set up a separate build with its required game version and configuration.', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'Search for a pack on Modrinth or choose a local .mrpack file during build creation'},
        {type:'imp',text:'The installer reads the pack’s Minecraft version and supports no loader, Fabric, Forge and Quilt packs'},
        {type:'breaking',text:'NeoForge .mrpack files are not accepted by the current installer'}
    ]},
    { id:'news_feature_first_run_195', date:'Aug 24, 2026', title:'A Gentler First Run', version:'v1.9.5', channel:'stable', icon:'gauge-high', summary:'Spectral helps new players choose sensible performance defaults, with room to tune them later.', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'A local first-run check considers available memory, processor, storage and screen before suggesting a performance profile'},
        {type:'imp',text:'Settings can recalculate recommendations and adjust memory, resolution, fullscreen mode and JVM arguments'},
        {type:'add',text:'Lower-motion visuals, reduced background effects and interface refresh limits help on weaker computers'}
    ]},
    { id:'news_feature_site_help_22', date:'Aug 12, 2026', title:'Help Center with a Path Forward', version:'Website 2.2', channel:'website', icon:'terminal', summary:'Guided checks and a copyable support note make it easier to explain a launch problem clearly.', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'Choose a startup, modded, performance or account symptom to see focused checks'},
        {type:'add',text:'Build a support note with Minecraft version, Java version and the final relevant Console error'},
        {type:'imp',text:'Searchable answers link site account details, game profiles, offline play and launcher diagnostics'}
    ]},
    { id:'news_feature_library_194', date:'Aug 2, 2026', title:'A Library for Every Kind of World', version:'v1.9.4', channel:'stable', icon:'cubes', summary:'Separate build folders make experimenting with loaders and mods less disruptive to existing worlds.', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'Create, rename, configure and copy builds with their own mods, settings, worlds and screenshots'},
        {type:'imp',text:'The last selected build is restored when the launcher opens again'},
        {type:'add',text:'A screenshot gallery can preview, open and remove images from each build'},
        {type:'imp',text:'Deleting a build requires confirmation because its local files, including saves, are removed'}
    ]},
    { id:'news_feature_java_193', date:'Jul 22, 2026', title:'The Right Java for the Right Version', version:'v1.9.3', channel:'stable', icon:'bolt', summary:'Spectral matches Java to the selected Minecraft release and can fetch a suitable runtime when one is missing.', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'Installed and previously downloaded Java runtimes are scanned and checked for compatibility'},
        {type:'add',text:'A suitable runtime can be downloaded automatically when none is available'},
        {type:'imp',text:'Advanced users can set a global custom Java path and JVM arguments; older game versions still use compatibility checks'}
    ]},
    { id:'news_feature_site_ideas_21', date:'Jul 11, 2026', title:'Ideas with More Context', version:'Website 2.1', channel:'website', icon:'globe', summary:'Community proposals became easier to browse and connect to the people behind them.', isCurrent:false, dimmed:false, items:[
        {type:'imp',text:'Idea cards make votes and moderation status easier to see'},
        {type:'add',text:'Profile and role pages give community contributions a clearer identity'},
        {type:'imp',text:'Developers can publish update entries from the site editor'}
    ]},
    { id:'news_feature_profiles_192', date:'Jul 1, 2026', title:'Profiles, Play & a Useful Console', version:'v1.9.2', channel:'stable', icon:'terminal', summary:'The five-tab desktop launcher ties a selected game profile and build to a visible launch process.', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'Create a local offline profile or authorize Ely.by in Accounts, including its two-factor code'},
        {type:'imp',text:'Play shows the selected build, loader, game profile, mod count, playtime and last launch'},
        {type:'add',text:'Console displays launch stages and Minecraft output with search, timestamps, copy and export'}
    ]},
    { id:'news_modmanager_redesign', date:'Jun 28, 2026', title:'Mod Manager Redesign', version:'v0.9.4', channel:'beta', summary:'A cleaner two-panel mod workflow with faster discovery, clearer actions and a more consistent launcher interface.', isCurrent:false, dimmed:false, items:[
        {type:'imp',text:'Mod Manager rebuilt to match the Library layout — the mod list sits on the left, with every action grouped in a panel on the right'},
        {type:'imp',text:'Bigger window and a cleaner header bar with a segmented Installed / Discover switch'},
        {type:'imp',text:'Unified icons and styling across the dialog — removed the icon chip backings and the dark box behind the tabs'}
    ]},
    { id:'news_site_overhaul', date:'Jun 26, 2026', title:'Website 2.0 — Accounts, Forum & Themes', version:'Website 2.0', channel:'website', summary:'The community site now feels like a real product surface with profiles, ideas, themes and developer controls.', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'Two-tier accounts: a site account now holds your own set of Minecraft launcher profiles'},
        {type:'add',text:'Community Ideas & Suggestions forum with upvotes and automatic content moderation'},
        {type:'add',text:'Admin panel to manage users, roles and forum posts — developers can publish updates right from the site'},
        {type:'add',text:'Brand-new light theme with an animated aurora background and a one-click dark/light toggle'},
        {type:'imp',text:'Polished login dialog, crisper 100px avatars and dozens of layout and colour fixes'}
    ]},
    { id:'news_1', date:'Jun 26, 2026', title:'Typography & SpectrAI Prototype', isCurrent:false, dimmed:false, items:[
        {type:'imp',text:'New refined fonts across the app — Sora for headings and Plus Jakarta Sans for the interface'},
        {type:'add',text:'Experimental SpectrAI panel added in source; it is not advertised as a ready-to-use assistant'},
        {type:'imp',text:'Accounts tab rebuilt to match the Library layout — list on the left, detailed profile card on the right'}
    ]},
    { id:'news_2', date:'Jun 25, 2026', title:'Performance & Launch Reliability', isCurrent:false, dimmed:false, items:[
        {type:'fix',text:'Modded builds now auto-install their required vanilla base, so they actually start'},
        {type:'add',text:'Step-by-step console diagnostics that help identify likely launch failures'},
        {type:'imp',text:'Smoother animations: cached particle background and paused effects on hidden tabs'},
        {type:'imp',text:'Native libraries are cached after first launch for faster restarts'}
    ]},
    { id:'news_3', date:'Jun 24, 2026', title:'Interface, Console & Localization', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'Full RU / EN coverage across every tab and dialog'},
        {type:'add',text:'Redesigned Console with colored log levels, search, copy and export'},
        {type:'imp',text:'Unified glassmorphism panels, centered titles and consistent controls'}
    ]},
    { id:'news_4', date:'Project Core', title:'Launcher Foundation', isCurrent:false, dimmed:true, items:[
        {type:'add',text:'Qt 6 / C++17 desktop app built with CMake and MinGW'},
        {type:'add',text:'Instance library, Java manager, version installer and mod manager'},
        {type:'add',text:'Discord Rich Presence, news system, settings and crash/log tooling'}
    ]}
];

// ── Storage helpers ───────────────────────────────────────────
function readJsonStorage(key, fallback, validate) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const value = JSON.parse(raw);
        return !validate || validate(value) ? value : fallback;
    } catch {
        return fallback;
    }
}
const STORED_ROLE_KEYS = new Set(['USER','VETERAN','PRO','LEGEND','SPECTRAL','MODERATOR','ADMIN','DEV']);
const SEEDED_USER_IDS = new Set(DEFAULT_SITE_USERS.map(user => user.id));
function normalizeStoredUser(user) {
    if (!user || typeof user !== 'object') return null;
    const id = safeIdentifier(user.id);
    const username = sanitizeField(user.username, 20);
    if (!id || !username) return null;
    const role = STORED_ROLE_KEYS.has(user.role) ? user.role : 'USER';
    // Keep an existing owner's local credential during the demo migration.
    // New visitors still receive a passwordless showcase profile, and cloud
    // deployments never accept a seeded password from browser storage.
    const keepLocalOwnerPassword = id === 'su_dev' && LOCAL_DEVELOPMENT_ORIGIN && !validSupabaseConfig();
    const storedPassword = sanitizeField(user.password, 128);
    return {
        id,
        username,
        email: sanitizeField(user.email, 254),
        password: SEEDED_USER_IDS.has(id) && !keepLocalOwnerPassword ? '' : (keepLocalOwnerPassword ? storedPassword || LOCAL_OWNER_PASSWORD : storedPassword),
        role,
        roleSource: sanitizeField(user.roleSource,32),
        displayName: sanitizeField(user.displayName || username, 24) || username,
        bio: sanitizeField(user.bio, 120),
        avatar: safeAvatarUrl(user.avatar),
        pendingAvatar: safeAvatarUrl(user.pendingAvatar),
        registeredAt: sanitizeField(user.registeredAt, 24),
        totalTimeSec: Math.max(0, Number(user.totalTimeSec) || 0),
        visitCount: Math.max(0, Math.floor(Number(user.visitCount) || 0)),
        lastSeen: user.lastSeen && !isNaN(new Date(user.lastSeen).getTime()) ? new Date(user.lastSeen).toISOString() : null,
        banned: Boolean(user.banned),
        status: sanitizeField(user.status, 100),
        mcTimeSec: Math.max(0, Number(user.mcTimeSec) || 0)
    };
}
function loadSiteUsers()  {
    const users = readJsonStorage(K_USERS, null, Array.isArray);
    return users ? users.map(normalizeStoredUser).filter(Boolean).slice(0, 250) : null;
}
function cacheableSiteUsers(users){return validSupabaseConfig()?users.map(user=>({...user,pendingAvatar:''})):users;}
function saveSiteUsers(u) { try{localStorage.setItem(K_USERS,JSON.stringify(cacheableSiteUsers(u)));}catch{return false;} cloudPushUsers(u); return true; }
function loadSession()    { try{return localStorage.getItem(K_SESSION)||null;}catch{return null;} }
function saveSession(id)  { try{if(id)localStorage.setItem(K_SESSION,id);else localStorage.removeItem(K_SESSION);}catch{} }
function loadMcAccounts(uid) {
    const accounts = readJsonStorage(K_MC_PFX+uid, null, Array.isArray);
    if (!accounts) return null;
    let changed = false;
    const sanitized = accounts.map(account => {
        if (!account || typeof account !== 'object') { changed = true; return null; }
        const { password, accessToken, refreshToken, ...safe } = account;
        if (password || accessToken || refreshToken) changed = true;
        const id = safeIdentifier(safe.id);
        const username = sanitizeField(safe.username, 32);
        if (!id || !username) { changed = true; return null; }
        const type = ['microsoft','elyby','offline'].includes(safe.type) ? safe.type : 'offline';
        return {
            id,
            username,
            displayName: sanitizeField(safe.displayName || username, 32) || username,
            type,
            uuid: sanitizeField(safe.uuid, 36),
            addedAt: sanitizeField(safe.addedAt, 24),
            playtime: sanitizeField(safe.playtime, 24) || '0h',
            favorite: Boolean(safe.favorite),
            lastUsed: safe.lastUsed && !isNaN(new Date(safe.lastUsed).getTime()) ? new Date(safe.lastUsed).toISOString() : null
        };
    }).filter(Boolean).slice(0, 100);
    if (changed) {
        try { localStorage.setItem(K_MC_PFX+uid, JSON.stringify(sanitized)); } catch {}
    }
    return sanitized;
}
function saveMcAccounts(uid,a) { try{localStorage.setItem(K_MC_PFX+uid,JSON.stringify(a));return true;}catch{return false;} }
function loadActiveMc(uid)     { try{return localStorage.getItem(K_MC_ACT+uid)||null;}catch{return null;} }
function saveActiveMc(uid,id)  { try{if(id)localStorage.setItem(K_MC_ACT+uid,id);else localStorage.removeItem(K_MC_ACT+uid);return true;}catch{return false;} }
function loadRoleOrders() { return AccountPolicy.reservations(readJsonStorage(K_ROLE_ORDERS, [], Array.isArray)); }
function saveRoleOrders(orders) { try{localStorage.setItem(K_ROLE_ORDERS,JSON.stringify(AccountPolicy.reservations(orders)));return true;}catch{return false;} }
function loadProfileStyles() { return readJsonStorage(K_PROFILE_STYLES, {}, value=>value&&typeof value==='object'&&!Array.isArray(value)); }
function saveProfileStyles(styles) { try{localStorage.setItem(K_PROFILE_STYLES,JSON.stringify(styles||{}));}catch{} }
function loadDevRolePreviews() { return readJsonStorage(K_DEV_ROLE_PREVIEWS, {}, value=>value&&typeof value==='object'&&!Array.isArray(value)); }
function saveDevRolePreviews(previews) { try{localStorage.setItem(K_DEV_ROLE_PREVIEWS,JSON.stringify(previews||{}));}catch{} }

// ── Cloud sync: authenticated owner only ──────────────────────
// These helpers never send the complete local database. They can only touch
// the authenticated user's own profile, Minecraft profiles and friendships.
// Privileged fields (role, ban state and account ownership) are server-owned.
function cloudPushUsers(users) {
    if (!cloudReady() || !Array.isArray(users)) return;
    const user = users.find(candidate => candidate.id === cloudAuthUserId);
    if (!user) return;
    const row = {
        total_time_sec: Math.max(0, Math.round(Number(user.totalTimeSec) || 0)),
        visit_count: Math.max(0, Math.floor(Number(user.visitCount) || 0)),
        last_seen: user.lastSeen || null
    };
    cloud.from('site_users').update(row).eq('id', cloudAuthUserId)
        .then(({ error }) => { if (error) handleCloudError('profile sync', error); })
        .catch(error => handleCloudError('profile sync', error));
}
let mcSaveInProgress = false;
const MC_ACCOUNT_COLUMNS = 'id,user_id,username,display_name,type,uuid,added_at,playtime,favorite,last_used,is_active';
function applyCloudMinecraftRows(uid, rows) {
    if (uid !== currentUserId || uid !== cloudAuthUserId) return false;
    mcAccounts = rows.map(row => ({
        id: safeIdentifier(row.id),
        username: sanitizeField(row.username, 32),
        displayName: sanitizeField(row.display_name || row.username, 32),
        type: ['microsoft','elyby','offline'].includes(row.type) ? row.type : 'offline',
        uuid: sanitizeField(row.uuid, 36) || offlineUuid(row.username),
        addedAt: sanitizeField(row.added_at, 24),
        playtime: sanitizeField(row.playtime, 24) || '0h',
        favorite: Boolean(row.favorite),
        lastUsed: row.last_used || null
    })).filter(account => account.id && account.username);
    activeMcId = rows.find(row => row.is_active)?.id || mcAccounts[0]?.id || null;
    saveMcAccounts(uid, mcAccounts);
    saveActiveMc(uid, activeMcId);
    return true;
}
async function refreshMinecraftProfiles() {
    if (!currentUserId || currentUserId !== cloudAuthUserId || !cloudReady()
        || mcSaveInProgress) return false;
    const uid = currentUserId;
    const {data, error} = await cloud.from('mc_accounts').select(MC_ACCOUNT_COLUMNS)
        .eq('user_id', uid).order('id', {ascending:true}).limit(100);
    if (error) { handleCloudError('Minecraft profile refresh', error); return false; }
    if (!applyCloudMinecraftRows(uid, data || [])) return false;
    renderAll();
    return true;
}
async function saveMinecraftProfiles(uid, accounts, activeId) {
    if (mcSaveInProgress) throw new Error('Wait for the current Minecraft profile change to finish.');
    if (uid !== currentUserId) throw new Error('Sign in again before changing Minecraft profiles.');
    mcSaveInProgress = true;
    try {
        if (validSupabaseConfig()) {
            if (!cloudReady() || uid !== cloudAuthUserId) throw new Error('Reconnect to save Minecraft profiles online.');
            const rows = accounts.map(account => ({
                id: safeIdentifier(account.id),
                user_id: uid,
                username: sanitizeField(account.username, 32),
                display_name: sanitizeField(account.displayName || account.username, 32),
                type: ['microsoft','elyby','offline'].includes(account.type) ? account.type : 'offline',
                uuid: sanitizeField(account.uuid, 36),
                added_at: sanitizeField(account.addedAt, 24),
                playtime: sanitizeField(account.playtime, 24) || '0h',
                favorite: Boolean(account.favorite),
                last_used: account.lastUsed || null,
                is_active: account.id === activeId
            }));
            if (rows.length > 100 || rows.some(row => !row.id || !row.username)) throw new Error('Invalid Minecraft profile data.');
            const {data:stored,error:readError}=await cloud.from('mc_accounts')
                .select(MC_ACCOUNT_COLUMNS)
                .eq('user_id',uid).limit(100);
            if (readError) throw readError;
            const existing=new Map((stored||[]).map(row=>[row.id,row]));
            const before=new Map(mcAccounts.map(account=>[account.id,account]));
            for (const row of rows) {
                const id=row.id;
                const baseline=before.get(id);
                const changes={};
                for(const key of ['username','display_name','type','uuid','added_at','playtime','favorite','last_used']) {
                    const oldValue=baseline && ({username:baseline.username,display_name:baseline.displayName,
                        type:baseline.type,uuid:baseline.uuid,added_at:baseline.addedAt,
                        playtime:baseline.playtime,favorite:baseline.favorite,last_used:baseline.lastUsed})[key];
                    if(!baseline || (row[key]??null)!==(oldValue??null))changes[key]=row[key];
                }
                if(baseline && !Object.keys(changes).length)continue;
                const request=existing.has(id)
                    ? cloud.from('mc_accounts').update(changes).eq('id',id).eq('user_id',uid)
                    : cloud.from('mc_accounts').insert({...row,is_active:false});
                const {data,error}=await request.select('id');
                if (error) throw error;
                if (!data?.some(saved=>saved.id===id)) throw new Error('The database did not confirm the Minecraft profile change.');
            }
            const keepIds=new Set(rows.map(row=>row.id));
            // Delete only rows this browser actually removed. A launcher-added
            // row absent from stale browser cache must stay in the database.
            const removed=[...before.keys()].filter(id=>!keepIds.has(id) && existing.has(id));
            if (removed.length) {
                const {error}=await cloud.from('mc_accounts').delete().eq('user_id',uid).in('id',removed);
                if (error) throw error;
            }
            if (activeId && activeId !== activeMcId) {
                const {data:selected,error:selectError}=await cloud.rpc('spectral_select_mc_account',{p_account_id:activeId});
                if (selectError) throw selectError;
                if (!selected?.some(row=>row.id===activeId)) throw new Error('The selected Minecraft profile was not saved.');
            }
            const {data:verified,error:verifyError}=await cloud.from('mc_accounts')
                .select(MC_ACCOUNT_COLUMNS)
                .eq('user_id',uid).limit(100);
            if (verifyError) throw verifyError;
            if (removed.some(id=>verified?.some(row=>row.id===id))
                || rows.some(row=>!verified?.some(saved=>saved.id===row.id)))
                throw new Error('The database did not confirm the final Minecraft profile list.');
            if (uid !== currentUserId) throw new Error('The account changed while saving Minecraft profiles.');
            applyCloudMinecraftRows(uid,verified||[]);
            return true;
        }
        if (uid !== currentUserId) throw new Error('The account changed while saving Minecraft profiles.');
        // Cloud is authoritative. A full browser cache must not turn a confirmed
        // online save into a failed user action; the next sign-in reloads it.
        const cachedAccounts=saveMcAccounts(uid,accounts);
        const cachedActive=saveActiveMc(uid,activeId);
        if (!validSupabaseConfig() && (!cachedAccounts || !cachedActive)) {
            throw new Error('Storage is full. Free some space and try again.');
        }
        mcAccounts=accounts;
        activeMcId=activeId;
        return true;
    } catch (error) {
        handleCloudError('Minecraft profile save',error);
        if (validSupabaseConfig() && !/Reconnect|account changed|Wait for/.test(error.message||'')) {
            throw new Error('Minecraft profiles could not be saved online. Please try again.',{cause:error});
        }
        throw error;
    } finally {
        mcSaveInProgress = false;
    }
}
function cloudPushFriends(list) {
    if (!cloudReady() || !Array.isArray(list) || currentUserId !== cloudAuthUserId) return;
    const currentUserRows = list.filter(friendship =>
        friendship.requester === cloudAuthUserId || friendship.addressee === cloudAuthUserId);
    const rows = currentUserRows.map(friendship => ({
        id: safeIdentifier(friendship.id),
        requester_id: safeIdentifier(friendship.requester),
        addressee_id: safeIdentifier(friendship.addressee),
        status: friendship.status === 'accepted' ? 'accepted' : 'pending',
        created_at: friendship.createdAt || new Date().toISOString()
    })).filter(row => row.id && row.requester_id && row.addressee_id && row.requester_id !== row.addressee_id);
    // The requester may create a pending request, while only the addressee may
    // accept it. Keeping those writes separate mirrors the database RLS rules
    // and prevents an upsert from accidentally taking the insert-policy path.
    rows.forEach(row => {
        let request = null;
        if (row.requester_id === cloudAuthUserId && row.status === 'pending') {
            request = cloud.from('friendships').upsert(row, { onConflict:'id' });
        } else if (row.addressee_id === cloudAuthUserId && row.status === 'accepted') {
            request = cloud.from('friendships').update({ status:'accepted' })
                .eq('id', row.id).eq('addressee_id', cloudAuthUserId);
        }
        if (request) request
            .then(({ error }) => { if (error) handleCloudError('friendship sync', error); })
            .catch(error => handleCloudError('friendship sync', error));
    });
    const keepIds = rows.map(row => row.id);
    let deletion = cloud.from('friendships').delete()
        .or(`requester_id.eq.${cloudAuthUserId},addressee_id.eq.${cloudAuthUserId}`);
    if (keepIds.length) deletion = deletion.not('id', 'in', `(${keepIds.join(',')})`);
    deletion.then(({ error }) => { if (error) handleCloudError('friendship cleanup', error); })
        .catch(error => handleCloudError('friendship cleanup', error));
}

function cloudProfileToUser(row, authEmail = '') {
    return normalizeStoredUser({
        id: row.id,
        username: row.username,
        email: row.id === cloudAuthUserId && !/@users\.spectral\.invalid$/i.test(authEmail) ? authEmail : '',
        password: '',
        role: row.role,
        displayName: row.display_name,
        bio: row.bio,
        avatar: row.avatar,
        pendingAvatar: row.pending_avatar,
        registeredAt: row.registered_at,
        totalTimeSec: row.total_time_sec,
        visitCount: row.visit_count,
        lastSeen: row.last_seen,
        banned: row.banned,
        status: row.status,
        mcTimeSec: row.mc_time_sec
    });
}

// RLS limits each result set. The profile query deliberately omits email and
// password_hash, even if a deployment accidentally grants broader SELECT.
async function cloudBootstrap(authUser = null) {
    if (!cloud || !cloudAuthUserId) return;
    const ownerId=cloudAuthUserId;
    cloudSyncing = true;
    let successful=false;
    try {
        const [profilesRes, mcRes, friendsRes, avatarQueueRes] = await Promise.all([
            cloud.from('site_users').select('id,username,role,display_name,bio,avatar,registered_at,total_time_sec,visit_count,last_seen,banned,status,mc_time_sec'),
            cloud.from('mc_accounts').select('id,user_id,username,display_name,type,uuid,added_at,playtime,favorite,last_used,is_active').eq('user_id', cloudAuthUserId).limit(100),
            cloud.from('friendships').select('id,requester_id,addressee_id,status,created_at').limit(500),
            cloud.from('spectral_avatar_queue').select('user_id,avatar').eq('user_id', cloudAuthUserId).maybeSingle()
        ]);
        if (profilesRes.error) throw profilesRes.error;
        if (mcRes.error) throw mcRes.error;
        if (friendsRes.error) throw friendsRes.error;
        if (!(profilesRes.data || []).some(row => row.id === ownerId)) {
            throw new Error('The account profile is missing from Supabase. Apply the Auth profile migration.');
        }

        if(cloudAuthUserId!==ownerId)return false;
        successful=true;
        const pendingAvatar = avatarQueueRes.error ? '' : avatarQueueRes.data?.avatar || '';
        (profilesRes.data || []).map(row => cloudProfileToUser({...row,pending_avatar:row.id===ownerId?pendingAvatar:''}, authUser?.email || '')).filter(Boolean).forEach(profile => {
            const index = siteUsers.findIndex(user => user.id === profile.id);
            if (index >= 0) siteUsers[index] = profile;
            else siteUsers.push(profile);
        });
        friendships = (friendsRes.data || []).map(row => ({
            id: safeIdentifier(row.id),
            requester: safeIdentifier(row.requester_id),
            addressee: safeIdentifier(row.addressee_id),
            status: row.status === 'accepted' ? 'accepted' : 'pending',
            createdAt: row.created_at || ''
        })).filter(friendship => friendship.id && friendship.requester && friendship.addressee);

        const accounts = (mcRes.data || []).map(row => ({
            id: safeIdentifier(row.id),
            username: sanitizeField(row.username, 32),
            displayName: sanitizeField(row.display_name || row.username, 32),
            type: ['microsoft','elyby','offline'].includes(row.type) ? row.type : 'offline',
            uuid: sanitizeField(row.uuid, 36) || offlineUuid(row.username),
            addedAt: sanitizeField(row.added_at, 24),
            playtime: sanitizeField(row.playtime, 24) || '0h',
            favorite: Boolean(row.favorite),
            lastUsed: row.last_used || null
        })).filter(account => account.id && account.username);
        try {
            localStorage.setItem(K_USERS, JSON.stringify(cacheableSiteUsers(siteUsers)));
            localStorage.setItem(K_FRIENDS, JSON.stringify(friendships));
            localStorage.setItem(K_MC_PFX + cloudAuthUserId, JSON.stringify(accounts));
            const active = (mcRes.data || []).find(row => row.is_active);
            if (active?.id) localStorage.setItem(K_MC_ACT + cloudAuthUserId, active.id);
        } catch {}
    } catch (error) {
        handleCloudError('authenticated sync', error);
    } finally {
        cloudSyncing = false;
    }
    reloadMcAccounts();
    renderAll();
    return successful;
}
function normalizeForumPost(post) {
    if (!post || typeof post !== 'object') return null;
    const id = safeIdentifier(post.id);
    const authorId = safeIdentifier(post.authorId);
    if (!id || !authorId) return null;
    return {
        id,
        authorId,
        authorName: sanitizeField(post.authorName, 24) || 'Player',
        authorRole: ['USER','VETERAN','PRO','LEGEND','SPECTRAL','MODERATOR','ADMIN','DEV'].includes(post.authorRole) ? post.authorRole : 'USER',
        title: sanitizeField(post.title, 80),
        text: sanitizeField(post.text, 500),
        date: sanitizeField(post.date, 24),
        upvotes: Array.isArray(post.upvotes) ? [...new Set(post.upvotes.map(value=>safeIdentifier(value)).filter(Boolean))].slice(0, 500) : [],
        voteCount: Number.isFinite(Number(post.voteCount)) ? Math.max(0, Number(post.voteCount)) : null,
        viewerVoted: Boolean(post.viewerVoted),
        createdAt: sanitizeField(post.createdAt,40),
        approved: Boolean(post.approved),
        rejected: Boolean(post.rejected)
    };
}
function normalizeNewsItem(item) {
    if (!item || typeof item !== 'object') return null;
    const id = safeIdentifier(item.id);
    if (!id) return null;
    const changes = Array.isArray(item.items) ? item.items.slice(0, 50).map(change=>({
        type: ['add','imp','fix','breaking','security'].includes(change?.type) ? change.type : 'imp',
        text: sanitizeField(change?.text, 500)
    })).filter(change=>change.text) : [];
    return {
        id,
        date: sanitizeField(item.date, 32),
        title: sanitizeField(item.title, 100),
        version: sanitizeField(item.version, 32),
        channel: ['stable','beta','dev','website'].includes(item.channel) ? item.channel : 'stable',
        icon: sanitizeField(item.icon, 40),
        summary: sanitizeField(item.summary, 220),
        isCurrent: Boolean(item.isCurrent),
        dimmed: Boolean(item.dimmed),
        items: changes
    };
}
function normalizeFriendship(friendship) {
    if (!friendship || typeof friendship !== 'object') return null;
    const id = safeIdentifier(friendship.id);
    const requester = safeIdentifier(friendship.requester);
    const addressee = safeIdentifier(friendship.addressee);
    if (!id || !requester || !addressee || requester === addressee) return null;
    return { id, requester, addressee, status:friendship.status==='accepted'?'accepted':'pending', createdAt:sanitizeField(friendship.createdAt,40) };
}
function loadForum()   { const posts=readJsonStorage(K_FORUM,null,Array.isArray);return posts?posts.map(normalizeForumPost).filter(Boolean).slice(0,250):null; }
function saveForum(p)  { try{localStorage.setItem(K_FORUM,JSON.stringify(p));}catch{} }
function loadNews()    { const news=readJsonStorage(K_NEWS,null,Array.isArray);return news?news.map(normalizeNewsItem).filter(Boolean).slice(0,100):null; }
function saveNews(n)   { try{localStorage.setItem(K_NEWS,JSON.stringify(n));}catch{} }
function loadFriends() { const friends=readJsonStorage(K_FRIENDS,null,Array.isArray);return friends?friends.map(normalizeFriendship).filter(Boolean).slice(0,500):null; }
function saveFriends(f){ try{localStorage.setItem(K_FRIENDS,JSON.stringify(f));}catch{} cloudPushFriends(f); }

// ── UUID generator ────────────────────────────────────────────
function offlineUuid(username) {
    const s='OfflinePlayer:'+(username||'');
    const bytes=[];let h=0x811c9dc5>>>0;
    for(let pass=0;pass<4;pass++){let x=(h^(pass*0x9e3779b9))>>>0;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,0x01000193)>>>0;}bytes.push((x>>>24)&255,(x>>>16)&255,(x>>>8)&255,x&255);h=x;}
    const b=bytes.slice(0,16);b[6]=(b[6]&0x0f)|0x30;b[8]=(b[8]&0x3f)|0x80;
    const hex=b.map(v=>v.toString(16).padStart(2,'0')).join('');
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20,32);
}

// ── State ─────────────────────────────────────────────────────
let siteUsers    = loadSiteUsers() || DEFAULT_SITE_USERS.map(u=>({...u}));
let currentUserId = loadSession();
let mcAccounts   = [];
let activeMcId   = null;
let forumPosts   = loadForum() || DEFAULT_FORUM.map(p=>({...p}));
let newsItems    = loadNews()  || DEFAULT_NEWS.map(n=>({...n}));
let friendships  = loadFriends() || DEFAULT_FRIENDS.map(f=>({...f}));

// Seed: inject any new default update entries into existing stored news (without
// wiping user/DEV-created ones). Bump NEWS_SEED_VERSION when adding new defaults.
const NEWS_SEED_VERSION = 4;
(function seedNews(){
    try {
        const seeded = parseInt(localStorage.getItem('spectral_news_seed') || '0', 10);
        if (seeded < NEWS_SEED_VERSION) {
            const have = new Set(newsItems.map(n => n.id));
            const fresh = DEFAULT_NEWS.filter(n => !have.has(n.id));
            if (fresh.length) {
                const customCurrent = newsItems.some(n => n.isCurrent && !DEFAULT_NEWS.some(seed => seed.id === n.id));
                if (!customCurrent) newsItems.forEach(n => { n.isCurrent = false; });
                newsItems = [...fresh.map(n => ({...n, isCurrent:!customCurrent && n.isCurrent})), ...newsItems];
                saveNews(newsItems);
            }
            localStorage.setItem('spectral_news_seed', String(NEWS_SEED_VERSION));
        }
    } catch {}
})();

// Upgrade older localStorage entries to the richer release-card format without
// replacing developer-authored titles or changelog text.
const NEWS_PRESENTATION_PRESETS = {
    news_modmanager_redesign: { version:'v0.9.4', channel:'beta', icon:'puzzle-piece', summary:'A cleaner two-panel mod workflow with faster discovery, clearer actions and a more consistent launcher interface.' },
    news_site_overhaul: { version:'Website 2.0', channel:'website', icon:'globe', summary:'Profiles, community ideas, themes and developer tools now live in one polished website experience.' },
    news_1: { version:'v0.9.3', channel:'beta', icon:'robot', summary:'Refined typography, a richer Accounts layout and an experimental SpectrAI panel.' },
    news_2: { version:'v0.9.2', channel:'stable', icon:'gauge-high', summary:'Faster launches, clearer diagnostics and more reliable setup for modded Minecraft instances.' },
    news_3: { version:'v0.9.1', channel:'stable', icon:'language', summary:'A consistent launcher interface with a redesigned console and complete RU / EN localization.' },
    news_4: { version:'Core', channel:'stable', icon:'cubes', summary:'The Qt 6 and C++17 foundation behind instances, Java management, versions, mods and diagnostics.' }
};
(function migrateNewsPresentation(){
    let changed=false;
    newsItems=newsItems.map((news,index)=>{
        const preset=NEWS_PRESENTATION_PRESETS[news.id]||{};
        const firstText=Array.isArray(news.items)&&news.items[0]?.text?news.items[0].text.replace(/[*`\[\]()]/g,''):'';
        const upgraded={
            ...news,
            version:news.version||preset.version||`Update ${Math.max(1,newsItems.length-index)}`,
            channel:news.channel||preset.channel||'stable',
            icon:news.icon||preset.icon||'bolt',
            summary:news.summary||preset.summary||firstText.slice(0,190)||'Launcher improvements and release notes.'
        };
        if(upgraded.version!==news.version||upgraded.channel!==news.channel||upgraded.icon!==news.icon||upgraded.summary!==news.summary)changed=true;
        return upgraded;
    });
    if(changed)saveNews(newsItems);
})();

// Correct the original seeded AI claim in existing browser storage. Leave
// developer-edited release entries untouched.
(function correctSeededAiNews(){
    const entry=newsItems.find(news=>news.id==='news_1');
    if(!entry)return;
    let changed=false;
    if(entry.title==='Typography & SpectrAI Assistant'){entry.title='Typography & SpectrAI Prototype';changed=true;}
    if(entry.summary==='Refined typography, a richer Accounts layout and the first integrated SpectrAI assistant experience.'){entry.summary='Refined typography, a richer Accounts layout and an experimental SpectrAI panel.';changed=true;}
    const oldText='Built-in SpectrAI assistant: a sliding chat panel that helps with mods, memory and launch errors';
    const item=entry.items?.find(change=>change.text===oldText);
    if(item){item.text='Experimental SpectrAI panel added in source; it is not advertised as a ready-to-use assistant';changed=true;}
    if(changed)saveNews(newsItems);
})();

// Validate session
if (currentUserId && (validSupabaseConfig() || !siteUsers.find(u=>u.id===currentUserId&&!u.banned))) { currentUserId=null; saveSession(null); }

// Init default MC accounts for default users
DEFAULT_SITE_USERS.forEach(u => {
    if (siteUsers.some(user=>user.id===u.id) && !loadMcAccounts(u.id) && DEFAULT_MC_ACCOUNTS[u.id]) {
        saveMcAccounts(u.id, DEFAULT_MC_ACCOUNTS[u.id]);
    }
});

// ── Load MC accounts for current site user ────────────────────
function reloadMcAccounts() {
    if (!currentUserId) { mcAccounts=[]; activeMcId=null; return; }
    mcAccounts = loadMcAccounts(currentUserId) || [];
    const storedActive=loadActiveMc(currentUserId);
    activeMcId = mcAccounts.some(account=>account.id===storedActive)?storedActive:(mcAccounts[0]?.id||null);
    if(activeMcId!==storedActive)saveActiveMc(currentUserId,activeMcId||'');
}

// ── Session time tracking ─────────────────────────────────────
// Accumulates real time-on-site for the logged-in user (active tab only),
// persisted to localStorage + Supabase so DEV analytics can show averages.
let _timeTick = null, _flushTimeTick = null, _timeListenersBound = false;
let _lastTickTs = Date.now(), _pendingTime = 0, _visitBumpedFor = null;
function beginUserSession() {
    const u = siteUsers.find(x => x.id === currentUserId);
    // Count one visit per logged-in user per page load (avoids double-counting
    // when cloudBootstrap re-runs this after the initial render).
    if (u && _visitBumpedFor !== u.id) {
        _visitBumpedFor = u.id;
        u.visitCount = (u.visitCount || 0) + 1; u.lastSeen = new Date().toISOString();
        saveSiteUsers(siteUsers);
    }
    startTimeTracking();
}
function startTimeTracking() {
    _lastTickTs = Date.now();
    if (_timeTick) return;
    _timeTick = setInterval(() => {
        const now = Date.now();
        if (document.hidden || !currentUserId) { _lastTickTs = now; return; }
        const delta = Math.min((now - _lastTickTs) / 1000, 120); // seconds, cap stray gaps
        _lastTickTs = now;
        _pendingTime += delta;
        const u = siteUsers.find(x => x.id === currentUserId);
        if (u) u.totalTimeSec = (u.totalTimeSec || 0) + delta;
    }, 5000);
    _flushTimeTick = setInterval(flushSessionTime, 30000);
    if (!_timeListenersBound) {
        _timeListenersBound = true;
        document.addEventListener('visibilitychange', () => { if (document.hidden) flushSessionTime(); _lastTickTs = Date.now(); });
        window.addEventListener('beforeunload', flushSessionTime);
    }
}
function flushSessionTime() {
    if (!currentUserId || _pendingTime < 1) return;
    const u = siteUsers.find(x => x.id === currentUserId);
    if (u) { u.lastSeen = new Date().toISOString(); saveSiteUsers(siteUsers); }
    _pendingTime = 0;
}
function stopTimeTracking() {
    flushSessionTime();
    if (_timeTick) clearInterval(_timeTick);
    if (_flushTimeTick) clearInterval(_flushTimeTick);
    _timeTick = null;
    _flushTimeTick = null;
    _lastTickTs = Date.now();
}

// ── Avatar URL ────────────────────────────────────────────────
function avatarUrl(username) { return `https://minotar.net/avatar/${encodeURIComponent(username)}/100`; }
function siteAvatarUrl(user) { return safeAvatarUrl(user?.avatar, 'assets/avatar-placeholder.svg'); }

// ── Roles (data-driven hierarchy) ─────────────────────────────
// rank drives permissions; higher rank = more power. Add a role here and it
// automatically appears in badges, the admin role picker and the stats charts.
const ROLES = {
    USER:      { label:'Player',    rank:0,  icon:'fas fa-user',          color:'#9ca3af', grad:'linear-gradient(135deg,#6b7280,#4b5563)', profileLimit:2,  favoriteLimit:1,  tagline:'The essential Spectral identity', perks:['2 launcher profiles','1 favorite profile','Nebula Drift animated header','Soft Signal menu entrance'] },
    VETERAN:   { label:'Veteran',   rank:1,  icon:'fas fa-shield-halved', color:'#2dd4bf', grad:'linear-gradient(135deg,#14b8a6,#0f766e)', profileLimit:4,  favoriteLimit:3,  tagline:'Permanent founder status', perks:['4 launcher profiles and 3 favorites','Permanent founding-year badge','Veteran Archive animated header','Aurora menu entrance effect'] },
    PRO:       { label:'Pro',       rank:2,  icon:'fas fa-star',          color:'#fbbf24', grad:'linear-gradient(135deg,#fbbf24,#d97706)', profileLimit:8,  favoriteLimit:8,  tagline:'Built for everyday players', perks:['8 launcher profiles and favorites','Golden nameplate and avatar frame','Solar Flux animated header','Solar profile identity effects'] },
    LEGEND:    { label:'Legend',    rank:3,  icon:'fas fa-crown',         color:'#a78bfa', grad:'linear-gradient(135deg,#8b5cf6,#6d28d9)', profileLimit:16, favoriteLimit:16, tagline:'A rare community presence', perks:['16 launcher profiles and favorites','Violet Crown animated header','Stardust profile-menu entrance','Violet nameplate and avatar frame'] },
    SPECTRAL:  { label:'Spectral',  rank:4,  icon:'fas fa-gem',           color:'#67e8f9', grad:'linear-gradient(135deg,#22d3ee,#8b5cf6 52%,#ec4899)', profileLimit:Infinity, favoriteLimit:Infinity, tagline:'The complete Spectral experience', perks:['Unlimited profiles and favorites','Prism Rift animated header','Prismatic nameplate and Rift entrance','All premium profile appearances'] },
    MODERATOR: { label:'Moderator', rank:10, icon:'fas fa-gavel',         color:'#60a5fa', grad:'linear-gradient(135deg,#3b82f6,#2563eb)', profileLimit:Infinity, favoriteLimit:Infinity, tagline:'Community moderation access', perks:['Unlimited profiles and favorites','Guardian Grid staff header','Moderation queue and safety tools','Verified staff identity effects'] },
    ADMIN:     { label:'Admin',     rank:20, icon:'fas fa-user-shield',   color:'#f87171', grad:'linear-gradient(135deg,#ef4444,#dc2626)', profileLimit:Infinity, favoriteLimit:Infinity, tagline:'Full community management', perks:['Unlimited profiles and favorites','Command Core animated header','User and role management suite','Live community analytics access'] },
    DEV:       { label:'Developer', rank:30, icon:'fas fa-code',          color:'#f472b6', grad:'linear-gradient(135deg,#ec4899,#f43f5e)', profileLimit:Infinity, favoriteLimit:Infinity, tagline:'Spectral development team', perks:['Every animated header and entrance','Safe preview of every account role','Release publishing and experiments','Developer-only Code Matrix identity'] }
};
const ROLE_ORDER = Object.keys(ROLES);
function roleInfo(role)  { return ROLES[role] || ROLES.USER; }
function roleRank(role)  { return roleInfo(role).rank; }
const VETERAN_CUTOFF = new Date(2027, 4, 1).getTime();
const PREMIUM_ROLES = ['PRO','LEGEND','SPECTRAL'];
function isVeteranEligible(user) {
    const value = user?.registeredAt;
    if (!value) return false;
    const calendarDate = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
    const registered = calendarDate
        ? new Date(+calendarDate[3], +calendarDate[2] - 1, +calendarDate[1]).getTime()
        : Date.parse(value);
    return Number.isFinite(registered) && registered < VETERAN_CUTOFF;
}
function roleForRegistration(date=new Date()) { return date.getTime() < VETERAN_CUTOFF ? 'VETERAN' : 'USER'; }
function roleProfileLimit(role) { return roleInfo(role).profileLimit; }
function roleFavoriteLimit(role) { return roleInfo(role).favoriteLimit; }
function formatRoleLimit(value) { return Number.isFinite(value) ? String(value) : 'Unlimited'; }
function applyAutomaticVeteran(users) {
    let changed = false;
    (users || []).forEach(user => {
        if (!validSupabaseConfig() && (!user.roleSource || user.roleSource === 'registration') && (!user.role || user.role === 'USER') && isVeteranEligible(user)) {
            user.role = 'VETERAN';
            user.roleSource = 'founder-2027';
            changed = true;
        }
    });
    return changed;
}
function updateVeteranRegistrationNote(){
    const note=document.getElementById('veteranRegistrationNote');if(!note)return;
    const title=note.querySelector('b');const copy=note.querySelector('small');
    const open=Date.now()<(validSupabaseConfig()?Date.UTC(2027,4,1):VETERAN_CUTOFF);
    note.classList.toggle('closed',!open);
    if(title)title.textContent=open?'Your starting role: Veteran':'Your starting role: Player';
    if(copy)copy.textContent=open?'Assigned automatically to accounts created before May 1, 2027. No selection or payment needed.':'The automatic Veteran reward closed on May 1, 2027.';
}
// Permission helpers — pass a user (or use the current viewer)
function canAccessAdmin(u) { return !!u && !u.banned && roleRank(u.role) >= ROLES.MODERATOR.rank; }
function canModerate(u)    { return !!u && !u.banned && roleRank(u.role) >= ROLES.MODERATOR.rank; }
function canManageUsers(u) { return !!u && !u.banned && roleRank(u.role) >= ROLES.ADMIN.rank; }
function isDev(u)          { return !!u && !u.banned && u.role === 'DEV'; }
function displayedRoleKey(user) {
    if (!user) return 'USER';
    if (!isDev(user)) return ROLE_ORDER.includes(user.role) ? user.role : 'USER';
    const preview=loadDevRolePreviews()[user.id];
    return ROLE_ORDER.includes(preview) ? preview : 'DEV';
}
function setDeveloperRolePreview(user,role) {
    if(!isDev(user)||!ROLE_ORDER.includes(role))return false;
    const previews=loadDevRolePreviews();previews[user.id]=role;saveDevRolePreviews(previews);
    const styles=loadProfileStyles();styles[user.id]={header:ROLE_DEFAULT_HEADERS[role]||'code',entrance:ROLE_DEFAULT_ENTRANCES[role]||'terminal'};saveProfileStyles(styles);
    return true;
}

// ── Role badge HTML ───────────────────────────────────────────
function roleBadgeHtml(role) {
    // Whitelist roles so a tampered value can't inject markup
    if (!ROLE_ORDER.includes(role) || role === 'USER') return '';
    const r = ROLES[role];
    return `<span class="role-badge role-${role.toLowerCase()}"><i class="${r.icon}"></i> ${r.label}</span>`;
}

// Upgrade eligible local Player accounts without touching manually assigned roles.
if (applyAutomaticVeteran(siteUsers)) saveSiteUsers(siteUsers);
updateVeteranRegistrationNote();

// ── Type helpers ──────────────────────────────────────────────
function typeLabel(t){ return {microsoft:'Microsoft (legacy profile)',elyby:'Ely.by',offline:'Offline'}[t]||t; }
function typeIcon(t) { return {microsoft:'fab fa-microsoft',elyby:'fas fa-cloud',offline:'fas fa-user-shield'}[t]||'fas fa-user'; }
// ══════════════════════════════════════════════════════════════
// RENDER FUNCTIONS
// ══════════════════════════════════════════════════════════════
function renderAll() {
    reloadMcAccounts();
    renderNavbar();
    renderLauncherNotice();
    renderActiveMcBanner();
    renderMcGrid();
    renderFriends();
    updateRequestBadge();
    renderDevWriteBtn();
    renderNewsTimeline();
    renderForum();
}

// ── Navbar ────────────────────────────────────────────────────
function renderNavbar() {
    const user = siteUsers.find(u=>u.id===currentUserId);
    if (document.body) document.body.dataset.accountRole = user ? displayedRoleKey(user) : 'GUEST';
    const accText = document.getElementById('accountText');
    const accEyebrow = document.getElementById('accountEyebrow');
    const accButton = document.getElementById('openDashboardBtn');
    const circle  = document.getElementById('navAvatarCircle');
    const launcherHead = document.getElementById('launcherSkinHead');
    if (user) {
        if (accText) accText.textContent = user.displayName||user.username;
        if (accEyebrow) accEyebrow.textContent = 'SIGNED IN';
        if (accButton) accButton.setAttribute('aria-label',`Open account panel for ${user.displayName||user.username}`);
        if (circle) { circle.innerHTML=`<img src="${esc(siteAvatarUrl(user))}" alt="${esc(user.displayName||user.username)} profile" width="40" height="40" decoding="async" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" data-avatar-fallback>`; }
        const launcherAccount = mcAccounts.find(a=>a.id===activeMcId);
        const launcherName = (launcherAccount||{displayName:user.displayName}).displayName || user.username;
        document.getElementById('launcherUsername').textContent = launcherName;
        if (launcherHead) {
            launcherHead.src = avatarUrl((launcherAccount && launcherAccount.username) || launcherName);
            launcherHead.onerror = function(){ this.onerror=null; this.src=avatarUrl('steve'); };
        }
    } else {
        if (accText) accText.textContent = 'Sign In';
        if (accEyebrow) accEyebrow.textContent = 'YOUR SPACE';
        if (accButton) accButton.setAttribute('aria-label','Sign in or open account panel');
        if (circle) circle.innerHTML = '<i class="fas fa-user"></i>';
        document.getElementById('launcherUsername').textContent = 'Guest';
        if (launcherHead) launcherHead.src = avatarUrl('steve');
    }
}

// ── Launcher notice ───────────────────────────────────────────
function renderLauncherNotice() {
    const notice = document.getElementById('launcherNotice');
    if (notice) notice.style.display = currentUserId ? 'none' : 'flex';
    const workspace = document.getElementById('accountsSignedInWorkspace');
    if (workspace) workspace.style.display = currentUserId ? 'block' : 'none';
    // When logged out, hide the banner + two-column area so the notice stands alone
    const banner  = document.getElementById('activeAccountBanner');
    const columns = document.getElementById('accountsColumns');
    if (banner)  banner.style.display = currentUserId ? '' : 'none';
    if (columns) columns.style.display = currentUserId ? '' : 'none';
}

// ── Active MC banner ──────────────────────────────────────────
function renderActiveMcBanner() {
    const banner    = document.getElementById('activeAccountBanner');
    const leftSec   = banner&&banner.querySelector('.active-account-left');
    const statsSec  = banner&&banner.querySelector('.active-account-stats');
    const noMsg     = document.getElementById('noAccountsMsg');
    const readyState = banner&&banner.querySelector('.account-ready-state');
    const identityCode = banner&&banner.querySelector('.cockpit-identity-code');
    const coreStatus = document.getElementById('cockpitCoreStatus');
    if (!banner) return;

    const active = mcAccounts.find(a=>a.id===activeMcId);
    const previousIdentity = banner.dataset.renderedIdentityId;
    const identityChanged = previousIdentity !== undefined && previousIdentity !== (active?.id || '');
    banner.dataset.renderedIdentityId = active?.id || '';
    banner.classList.toggle('has-active',Boolean(active));
    if (!active) {
        if (leftSec)  leftSec.style.display='none';
        if (statsSec) statsSec.style.display='none';
        if (noMsg)    noMsg.style.display='flex';
        if (readyState) readyState.style.display='none';
        if (identityCode) identityCode.style.display='none';
        if (coreStatus) coreStatus.innerHTML='<i></i> Waiting for identity';
        return;
    }
    if (leftSec)  leftSec.style.display='flex';
    if (statsSec) statsSec.style.display='flex';
    if (noMsg)    noMsg.style.display='none';
    if (readyState) readyState.style.display='flex';
    if (identityCode) identityCode.style.display='grid';
    if (coreStatus) coreStatus.innerHTML='<i></i> Selected game profile';

    const img = document.getElementById('activeAvatarImg');
    if (img){ img.src=avatarUrl(active.username); img.onerror=function(){this.onerror=null;this.src=avatarUrl('steve');}; }
    const nameEl = document.getElementById('activeAccountName');
    if (nameEl) nameEl.textContent = active.displayName||active.username;
    const typeEl = document.getElementById('activeAccountType');
    if (typeEl) { typeEl.className=`active-account-type type-${active.type}`; typeEl.innerHTML=`<i class="${typeIcon(active.type)}"></i> ${typeLabel(active.type)}`; }
    const timeEl = document.getElementById('activeAccountTime');
    if (timeEl) timeEl.textContent = active.playtime||'0h';
    const dateEl = document.getElementById('activeAccountDate');
    if (dateEl) dateEl.textContent = active.addedAt||'—';
    const uuidEl = document.getElementById('activeUuidText');
    if (uuidEl) uuidEl.textContent = active.uuid||offlineUuid(active.username);
    banner.classList.remove('identity-switching');
    clearTimeout(banner._identitySwitchTimer);
    if (identityChanged) {
        void banner.offsetWidth;
        requestAnimationFrame(()=>banner.classList.add('identity-switching'));
        banner._identitySwitchTimer=setTimeout(()=>banner.classList.remove('identity-switching'),620);
    }
}

// ── MC Accounts grid ──────────────────────────────────────────
let accFilter='all', accSearch='', accSort='recent';
function updateAccountCockpitMetrics() {
    const user=siteUsers.find(item=>item.id===currentUserId);
    const limit=user?roleProfileLimit(user.role||'USER'):null;
    const count=mcAccounts.length;
    const profileCount=document.getElementById('cockpitProfileCount');if(profileCount)profileCount.textContent=String(count);
    const slotLabel=user?formatRoleLimit(limit):'—';
    const slotLimit=document.getElementById('cockpitSlotLimit');if(slotLimit)slotLimit.textContent=slotLabel;
}
function getFilteredMc() {
    let list = mcAccounts.slice();
    if (accSearch) { const q=accSearch.toLowerCase(); list=list.filter(a=>(a.displayName||a.username).toLowerCase().includes(q)||a.username.toLowerCase().includes(q)); }
    if (accFilter==='favorite') list=list.filter(a=>a.favorite);
    else if (accFilter!=='all') list=list.filter(a=>a.type===accFilter);
    const pt=a=>parseFloat(String(a.playtime).replace(/[^0-9.]/g,''))||0;
    const pd=a=>{const p=String(a.addedAt||'').split('.');return p.length===3?new Date(+p[2],+p[1]-1,+p[0]).getTime():0;};
    if(accSort==='name')list.sort((a,b)=>(a.displayName||a.username).localeCompare(b.displayName||b.username));
    else if(accSort==='playtime')list.sort((a,b)=>pt(b)-pt(a));
    else if(accSort==='added')list.sort((a,b)=>pd(b)-pd(a));
    else list.sort((a,b)=>{const la=a.lastUsed?Date.parse(a.lastUsed):0,lb=b.lastUsed?Date.parse(b.lastUsed):0;return lb-la;});
    list.sort((a,b)=>(b.favorite?1:0)-(a.favorite?1:0));
    return list;
}
function renderMcGrid() {
    const grid = document.getElementById('accountsGrid');
    const empty = document.getElementById('accountsEmpty');
    const emptyTxt = document.getElementById('accountsEmptyText');
    if (!grid) return;
    updateAccountCockpitMetrics();

    if (!currentUserId) {
        grid.replaceChildren();
        delete grid.dataset.renderFingerprint;
        if (empty) empty.style.display='block';
        const emptyAdd=document.getElementById('accountsEmptyAddBtn');if(emptyAdd)emptyAdd.style.display='none';
        if (emptyTxt) emptyTxt.textContent='Sign in to your site account to see your Minecraft profiles';
        return;
    }
    const list = getFilteredMc();
    if (list.length===0) {
        grid.replaceChildren();
        delete grid.dataset.renderFingerprint;
        if (empty) empty.style.display='block';
        if (emptyTxt) emptyTxt.textContent = mcAccounts.length===0 ? 'No Minecraft profiles yet' : 'No profiles match your filters';
        const emptyAdd=document.getElementById('accountsEmptyAddBtn');if(emptyAdd)emptyAdd.style.display=mcAccounts.length===0?'inline-flex':'none';
        return;
    }
    if (empty) empty.style.display='none';
    const fingerprint=JSON.stringify([currentUserId,activeMcId,list]);
    if(grid.dataset.renderFingerprint===fingerprint&&grid.childElementCount===list.length)return;
    grid.replaceChildren();
    grid.dataset.renderFingerprint=fingerprint;
    grid.onclick = e => {
        const fav=e.target.closest('.acc-fav'); if(fav&&grid.contains(fav)){e.preventDefault();e.stopPropagation();toggleMcFav(fav.dataset.id);return;}
        const del=e.target.closest('.acc-btn-delete'); if(del&&grid.contains(del)){e.preventDefault();e.stopPropagation();const card=del.closest('.account-card');const id=del.dataset.id||(card&&card.dataset.id);if(id)deleteMcAccount(id,card);return;}
        const sel=e.target.closest('.acc-btn-select'); if(sel&&grid.contains(sel)){e.preventDefault();e.stopPropagation();if(sel.dataset.id)selectMcAccount(sel.dataset.id);return;}
        const card=e.target.closest('.account-card'); if(card&&grid.contains(card)&&card.dataset.id)selectMcAccount(card.dataset.id);
    };
    list.forEach((acc, idx) => {
        const isActive = acc.id===activeMcId;
        const card = document.createElement('div');
        card.className=`account-card glass${isActive?' is-active':''}${acc.favorite?' is-fav':''}`;
        card.dataset.id=acc.id;
        card.style.setProperty('--i', idx);
        card.innerHTML=`
            <button class="acc-fav${acc.favorite?' on':''}" data-id="${esc(acc.id)}" title="${acc.favorite?'Remove from favorites':'Add to favorites'}" aria-label="${acc.favorite?'Remove from favorites':'Add to favorites'}" aria-pressed="${Boolean(acc.favorite)}" type="button"><i class="fas fa-star" aria-hidden="true"></i></button>
            ${isActive?'<span class="acc-active-tag"><span class="acc-active-dot"></span> Active</span>':''}
            <div class="acc-card-top">
                <div class="acc-avatar">
                    <img src="${avatarUrl(acc.username)}" alt="${esc(acc.username)}" width="100" height="100" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback>
                </div>
                <div class="acc-card-head">
                    <div class="acc-card-name">${esc(acc.displayName||acc.username)}</div>
                    <span class="active-account-type type-${acc.type}" style="font-size:0.72rem;padding:3px 10px;"><i class="${typeIcon(acc.type)}"></i> ${typeLabel(acc.type)}</span>
                </div>
            </div>
            <div class="acc-card-meta">
                <span title="Time in game"><i class="fas fa-clock"></i> ${acc.playtime||'0h'}</span>
                <span title="Date added"><i class="fas fa-calendar-alt"></i> ${acc.addedAt||'—'}</span>
            </div>
            <div class="acc-card-actions">
                <button class="acc-btn-select${isActive?' selected':''}" data-id="${esc(acc.id)}" type="button">${isActive?'<i class="fas fa-check"></i> Active':'<i class="fas fa-play"></i> Select'}</button>
                <button class="acc-btn-delete" data-id="${esc(acc.id)}" type="button" title="Delete"><i class="fas fa-trash-alt"></i></button>
            </div>`;
        grid.appendChild(card);
    });
}
async function toggleMcFav(id){
    const a=mcAccounts.find(account=>account.id===id);if(!a||mcSaveInProgress)return;
    const user=currentRoleUser();
    const limit=roleFavoriteLimit(user?.role||'USER');
    if(!a.favorite&&Number.isFinite(limit)&&mcAccounts.filter(account=>account.favorite).length>=limit){
        showToast(`${roleInfo(user?.role).label} supports ${limit} favorite ${limit===1?'profile':'profiles'}. Explore roles for more.`,'star');
        return;
    }
    const next=mcAccounts.map(account=>account.id===id?{...account,favorite:!account.favorite}:account);
    try{await saveMinecraftProfiles(currentUserId,next,activeMcId);renderMcGrid();}
    catch(error){showToast(error.message,'triangle-exclamation');}
}
async function selectMcAccount(id){
    if(!currentUserId||activeMcId===id||mcSaveInProgress)return;
    if(!mcAccounts.some(account=>account.id===id))return;
    const next=mcAccounts.map(account=>account.id===id?{...account,lastUsed:new Date().toISOString()}:account);
    try{await saveMinecraftProfiles(currentUserId,next,id);renderAll();}
    catch(error){showToast(error.message,'triangle-exclamation');}
}
function deleteMcAccount(id, cardEl) {
    const ownerId=currentUserId;const a=mcAccounts.find(a=>a.id===id);if(!a||!ownerId)return;
    showConfirm(`Delete Minecraft profile "${a.displayName||a.username}"?`,async()=>{
        if(mcSaveInProgress)return;
        const next=mcAccounts.filter(account=>account.id!==id);
        const nextActive=activeMcId===id?(next[0]?.id||null):activeMcId;
        try{await saveMinecraftProfiles(ownerId,next,nextActive);if(cardEl)cardEl.classList.add('removing');renderAll();}
        catch(error){showToast(error.message,'triangle-exclamation');}
    });
}
async function addMcAccount(username, type) {
    if (!currentUserId) { openDashboard(); return false; }
    if(mcSaveInProgress)return false;
    const user=currentRoleUser();
    const limit=roleProfileLimit(user?.role||'USER');
    if(Number.isFinite(limit)&&mcAccounts.length>=limit){showToast(`${roleInfo(user?.role).label} includes ${limit} launcher profile slots.`,'users-rectangle');openRoleStore();return false;}
    const today=new Date();
    const dateStr=`${String(today.getDate()).padStart(2,'0')}.${String(today.getMonth()+1).padStart(2,'0')}.${today.getFullYear()}`;
    const acc={id:'la_'+crypto.randomUUID().replace(/-/g,''),username:username.trim(),displayName:username.trim(),type,addedAt:dateStr,playtime:'0h',lastUsed:null,favorite:false,uuid:offlineUuid(username.trim())};
    try{await saveMinecraftProfiles(currentUserId,[acc,...mcAccounts],acc.id);renderAll();return true;}
    catch(error){showToast(error.message,'triangle-exclamation');return false;}
}

// (Accounts toolbar removed — profiles now render as a simple list; default sort applies)
// ══════════════════════════════════════════════════════════════
// FRIENDS SYSTEM (between site users)
// ══════════════════════════════════════════════════════════════
// Queries over the shared `friendships` list, always from the point of view of
// a given user id. A relationship's "other" party is whichever end isn't `uid`.
function friendOtherId(f, uid) { return f.requester === uid ? f.addressee : f.requester; }
function findFriendship(a, b) {
    return friendships.find(f =>
        (f.requester === a && f.addressee === b) ||
        (f.requester === b && f.addressee === a));
}
// Accepted friends of uid
function getFriends(uid)          { return friendships.filter(f => f.status === 'accepted' && (f.requester === uid || f.addressee === uid)); }
// Requests waiting for uid to accept/decline
function getIncomingRequests(uid) { return friendships.filter(f => f.status === 'pending' && f.addressee === uid); }
// Requests uid sent that are still pending
function getOutgoingRequests(uid) { return friendships.filter(f => f.status === 'pending' && f.requester === uid); }

// Presence derived from last_seen — same rule as the launcher.
function presenceOf(user) {
    const t = user && user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
    const sec = t ? (Date.now() - t) / 1000 : Infinity;
    if (sec < 180)  return { text:'Online',  cls:'online',  online:true  };
    if (sec < 1800) return { text:`Away · ${Math.floor(sec/60)}m`, cls:'away', online:false };
    return { text:'Offline', cls:'offline', online:false };
}
function formatMcTime(sec){ sec=Math.round(sec||0); const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60); return h?`${h}h ${m}m`:`${m}m`; }

function showFriendMsg(text, ok) {
    const el = document.getElementById('friendAddMsg');
    if (!el) return;
    el.textContent = text;
    el.style.display = 'block';
    el.className = 'friend-add-msg ' + (ok ? 'ok' : 'err');
}

async function findSiteUserByName(name) {
    if (cloudReady() && currentUserId === cloudAuthUserId) {
        const { data, error } = await cloud.rpc('find_site_user_by_username', { search_username:name });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        const profile = row ? cloudProfileToUser(row) : null;
        if (profile) {
            const index = siteUsers.findIndex(user=>user.id===profile.id);
            if (index >= 0) siteUsers[index]=profile;else siteUsers.push(profile);
        }
        return profile;
    }
    return siteUsers.find(user =>
        user.username.toLowerCase() === name.toLowerCase()
        || (user.displayName || '').toLowerCase() === name.toLowerCase()) || null;
}
async function sendFriendRequest(rawName) {
    if (!currentUserId) { openDashboard(); return; }
    const name = sanitizeField(rawName, 30);
    if (!name) { showFriendMsg('Enter a username to add.', false); return; }
    let target=null;
    try{target=await findSiteUserByName(name);}catch(error){handleCloudError('user lookup',error);showFriendMsg('Player search is temporarily unavailable.',false);return;}
    if (!target)                     { showFriendMsg(`No user named "${name}" found.`, false); return; }
    if (target.id === currentUserId) { showFriendMsg("You can't add yourself.", false); return; }
    const existing = findFriendship(currentUserId, target.id);
    if (existing) {
        if (existing.status === 'accepted')             showFriendMsg(`You're already friends with ${target.displayName || target.username}.`, false);
        else if (existing.requester === currentUserId)  showFriendMsg(`Request to ${target.displayName || target.username} is already pending.`, false);
        else                                            showFriendMsg(`${target.displayName || target.username} already sent you a request — check below.`, false);
        return;
    }
    friendships.push({ id:'fr_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
        requester: currentUserId, addressee: target.id, status:'pending', createdAt: new Date().toISOString() });
    saveFriends(friendships);
    showFriendMsg(`Friend request sent to ${target.displayName || target.username}.`, true);
    const input = document.getElementById('friendAddInput'); if (input) input.value = '';
    renderFriends();
}
function acceptFriendRequest(id) {
    const f = friendships.find(x => x.id === id);
    if (!f || f.addressee !== currentUserId) return;
    f.status = 'accepted';
    saveFriends(friendships);
    renderFriends();
    const u = siteUsers.find(x => x.id === f.requester);
    showToast(`You are now friends with ${u ? (u.displayName||u.username) : 'this user'}`, 'user-check');
}
function declineFriendRequest(id) {
    friendships = friendships.filter(f => f.id !== id);
    saveFriends(friendships);
    renderFriends();
}
function removeFriend(id) {
    const f = friendships.find(x => x.id === id);
    if (!f) return;
    const other = siteUsers.find(u => u.id === friendOtherId(f, currentUserId));
    showConfirm(`Remove ${other ? (other.displayName||other.username) : 'this friend'} from your friends?`, () => {
        friendships = friendships.filter(x => x.id !== id);
        saveFriends(friendships);
        renderFriends();
    });
}

function friendCardHtml(user, kind, frId) {
    // kind: 'friend' | 'incoming' | 'outgoing'
    const name = esc(user.displayName || user.username);
    const pres = presenceOf(user);
    // Sub-line: custom status wins; otherwise presence (friends) or @handle (requests).
    const sub  = user.status ? esc(user.status)
               : (kind === 'friend' ? pres.text : '@' + esc(user.username));
    let actions = '';
    const safeFriendshipId = esc(safeIdentifier(frId));
    if (kind === 'friend')        actions = `<button class="friend-btn remove" data-fr-remove="${safeFriendshipId}" type="button" title="Remove friend"><i class="fas fa-user-minus"></i></button>`;
    else if (kind === 'incoming') actions = `<button class="friend-btn accept" data-fr-accept="${safeFriendshipId}" type="button"><i class="fas fa-check"></i> Accept</button>
                                             <button class="friend-btn decline" data-fr-decline="${safeFriendshipId}" type="button" title="Decline"><i class="fas fa-xmark"></i></button>`;
    else                          actions = `<span class="friend-pending"><i class="fas fa-clock"></i> Pending</span>
                                             <button class="friend-btn decline" data-fr-decline="${safeFriendshipId}" type="button" title="Cancel request"><i class="fas fa-xmark"></i></button>`;
    return `<div class="friend-card glass" data-fr-user="${esc(safeIdentifier(user.id))}" title="View profile">
        <div class="friend-av-wrap">
            <img class="friend-avatar" src="${esc(siteAvatarUrl(user))}" alt="${name}" width="100" height="100" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback>
            <span class="friend-dot ${pres.cls}"></span>
        </div>
        <div class="friend-info">
            <div class="friend-name">${name} ${roleBadgeHtml(user.role)}</div>
            <div class="friend-user">${sub}</div>
        </div>
        <div class="friend-actions">${actions}</div>
    </div>`;
}

// ── Friend info modal ─────────────────────────────────────────
function openFriendInfo(userId) {
    const u = siteUsers.find(x => x.id === userId);
    const ov = document.getElementById('friendInfoOverlay');
    const body = document.getElementById('friendInfoBody');
    if (!u || !ov || !body) return;
    const pres = presenceOf(u);
    const fr = findFriendship(currentUserId, userId);
    const isFriend = fr && fr.status === 'accepted';
    const since = fr && fr.createdAt ? new Date(fr.createdAt).toLocaleDateString() : '—';
    const roleKey = displayedRoleKey(u);
    const role = roleInfo(roleKey);
    const profileStyle = profileStyleFor(u);
    const headerPreset = PROFILE_HEADERS[profileStyle.header] || PROFILE_HEADERS.nebula;
    const entrancePreset = PROFILE_ENTRANCES[profileStyle.entrance] || PROFILE_ENTRANCES.signal;
    const viewerFriendIds = new Set(getFriends(currentUserId).map(link=>friendOtherId(link,currentUserId)));
    const mutualCount = getFriends(userId).map(link=>friendOtherId(link,userId)).filter(id=>viewerFriendIds.has(id)).length;
    const relationship = isFriend ? `Friends since ${since}` : (fr?.status === 'pending' ? (fr.addressee === currentUserId ? 'Friend request received' : 'Friend request sent') : 'Community profile');
    const stat = (label, val, icon) =>
        `<div class="fi-stat"><i class="fas fa-${icon}"></i><div><span class="fi-stat-val">${val}</span><span class="fi-stat-lbl">${label}</span></div></div>`;
    body.innerHTML = `
        <article class="friend-profile-card" style="--friend-role:${role.color}">
            <section class="friend-profile-cover profile-cover" data-header="${profileStyle.header}">
                <div class="profile-cover-scene" aria-hidden="true"><i></i><i></i><i></i><span></span><b></b></div>
                <div class="friend-profile-cover-top">
                    <span><i class="${headerPreset.icon}"></i> ${esc(headerPreset.label)}</span>
                    <em><i class="fas fa-earth-europe"></i> Public profile</em>
                </div>
                <div class="friend-profile-identity">
                    <div class="friend-av-wrap fi-av">
                        <img src="${esc(siteAvatarUrl(u))}" alt="${esc(u.displayName || u.username)}" width="100" height="100" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback>
                        <span class="friend-dot ${pres.cls}"></span>
                    </div>
                    <div class="fi-head-text">
                        <div class="fi-presence ${pres.cls}"><i></i>${pres.text}</div>
                        <div class="fi-name">${esc(u.displayName || u.username)} ${roleBadgeHtml(roleKey)}</div>
                        <div class="fi-handle">@${esc(u.username)}</div>
                    </div>
                    <div class="friend-profile-signal"><small>Profile signal</small><b>${esc(entrancePreset.label)}</b><em>${esc(relationship)}</em></div>
                </div>
            </section>
            <div class="friend-profile-main">
                <section class="friend-profile-about">
                    <div class="friend-profile-section-title"><span><i class="fas fa-address-card"></i></span><div><small>Identity</small><h3>About this player</h3></div></div>
                    ${u.status ? `<div class="fi-status"><i class="fas fa-quote-left"></i><span>${esc(u.status)}</span></div>` : ''}
                    <div class="fi-bio">${esc(u.bio || 'This player has not added a biography yet.')}</div>
                    <div class="friend-role-access">
                        <span class="friend-role-access-icon" style="background:${role.grad}"><i class="${role.icon}"></i></span>
                        <div><small>Role access</small><b>${esc(role.label)}</b><em>${esc(role.tagline)}</em></div>
                        <strong>${formatRoleLimit(roleProfileLimit(roleKey))}<small>slots</small></strong>
                    </div>
                </section>
                <section class="friend-profile-overview">
                    <div class="friend-profile-section-title"><span><i class="fas fa-chart-simple"></i></span><div><small>Activity</small><h3>Player overview</h3></div></div>
                    <div class="fi-stats">
                        ${stat('In Minecraft', formatMcTime(u.mcTimeSec), 'gamepad')}
                        ${stat('On site', formatDuration(u.totalTimeSec), 'clock')}
                        ${stat('Member since', esc(u.registeredAt || '—'), 'calendar-alt')}
                        ${stat('Last seen', timeAgo(u.lastSeen), 'eye')}
                        ${stat('Friends', String(getFriends(userId).length), 'user-group')}
                        ${stat('Mutual friends', String(mutualCount), 'people-arrows')}
                    </div>
                </section>
            </div>
            <footer class="friend-profile-footer">
                <span><i class="fas fa-link"></i>${esc(relationship)}</span>
                ${isFriend ? `<button class="fi-remove-btn" data-fi-remove="${esc(safeIdentifier(fr.id))}"><i class="fas fa-user-minus"></i> Remove friend</button>` : ''}
            </footer>
        </article>`;
    const modal = ov.querySelector('.friend-info-modal');
    ov.dataset.entrance = profileStyle.entrance;
    if (modal) modal.style.setProperty('--friend-role', role.color);
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeFriendInfo() {
    const ov = document.getElementById('friendInfoOverlay');
    if (ov) ov.classList.remove('open');
    syncBodyScrollLock();
}

// Notification badge (incoming friend requests) on the account button.
function updateRequestBadge() {
    const badge = document.getElementById('reqBadge');
    if (!badge) return;
    const n = currentUserId ? getIncomingRequests(currentUserId).length : 0;
    badge.textContent = n > 9 ? '9+' : String(n);
    badge.style.display = n > 0 ? 'flex' : 'none';
}

function renderFriends() {
    const section = document.getElementById('friendsSection');
    if (!section) return;
    // Only meaningful when signed in
    section.style.display = currentUserId ? (section.classList.contains('cockpit-rail')?'flex':'block') : 'none';
    if (!currentUserId) { const cockpitFriendCount=document.getElementById('cockpitFriendCount');if(cockpitFriendCount)cockpitFriendCount.textContent='0';return; }

    const incoming = getIncomingRequests(currentUserId);
    const outgoing = getOutgoingRequests(currentUserId);
    const friends  = getFriends(currentUserId);

    const countEl = document.getElementById('friendsCount');
    if (countEl) countEl.textContent = friends.length;
    const cockpitFriendCount = document.getElementById('cockpitFriendCount');
    if (cockpitFriendCount) cockpitFriendCount.textContent = String(friends.length);
    updateRequestBadge();

    // Incoming / outgoing requests block
    const reqWrap = document.getElementById('friendRequests');
    if (reqWrap) {
        let html = '';
        if (incoming.length) {
            html += `<div class="friend-req-title"><i class="fas fa-inbox"></i> Requests received <span class="friends-count">${incoming.length}</span></div>`;
            incoming.forEach(f => { const u = siteUsers.find(x => x.id === f.requester); if (u) html += friendCardHtml(u, 'incoming', f.id); });
        }
        if (outgoing.length) {
            html += `<div class="friend-req-title"><i class="fas fa-paper-plane"></i> Requests sent <span class="friends-count">${outgoing.length}</span></div>`;
            outgoing.forEach(f => { const u = siteUsers.find(x => x.id === f.addressee); if (u) html += friendCardHtml(u, 'outgoing', f.id); });
        }
        reqWrap.innerHTML = html;
        reqWrap.style.display = html ? (reqWrap.closest('.cockpit-social-rail')?'flex':'grid') : 'none';
    }

    // Friends list
    const grid = document.getElementById('friendsGrid');
    const empty = document.getElementById('friendsEmpty');
    if (grid) {
        grid.innerHTML = '';
        friends.forEach(f => { const u = siteUsers.find(x => x.id === friendOtherId(f, currentUserId)); if (u) grid.insertAdjacentHTML('beforeend', friendCardHtml(u, 'friend', f.id)); });
    }
    if (empty) empty.style.display = friends.length ? 'none' : 'flex';
}

// Friends UI event wiring (delegated)
const friendAddForm = document.getElementById('friendAddForm');
if (friendAddForm) friendAddForm.addEventListener('submit', async e => {
    e.preventDefault();
    const input = document.getElementById('friendAddInput');
    const submit=friendAddForm.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
    try{await sendFriendRequest(input ? input.value : '');}finally{if(submit)submit.disabled=false;}
});
const friendsSectionEl = document.getElementById('friendsSection');
if (friendsSectionEl) friendsSectionEl.addEventListener('click', e => {
    const acc = e.target.closest('[data-fr-accept]');  if (acc) { acceptFriendRequest(acc.dataset.frAccept); return; }
    const dec = e.target.closest('[data-fr-decline]'); if (dec) { declineFriendRequest(dec.dataset.frDecline); return; }
    const rem = e.target.closest('[data-fr-remove]');  if (rem) { removeFriend(rem.dataset.frRemove); return; }
    // Anywhere else on a card → open that user's info.
    const card = e.target.closest('[data-fr-user]'); if (card) openFriendInfo(card.dataset.frUser);
});

// Friend info modal: close + remove-from-modal.
const friendInfoOverlayEl = document.getElementById('friendInfoOverlay');
if (friendInfoOverlayEl) {
    friendInfoOverlayEl.addEventListener('click', e => {
        if (e.target === friendInfoOverlayEl) { closeFriendInfo(); return; }
        const rem = e.target.closest('[data-fi-remove]');
        if (rem) { closeFriendInfo(); removeFriend(rem.dataset.fiRemove); }
    });
}
const closeFriendInfoBtn = document.getElementById('closeFriendInfoBtn');
if (closeFriendInfoBtn) closeFriendInfoBtn.addEventListener('click', closeFriendInfo);

// UUID copy
const uuidBtn=document.getElementById('activeAccountUuid');
if(uuidBtn)uuidBtn.addEventListener('click',()=>{const a=mcAccounts.find(a=>a.id===activeMcId);if(!a)return;const uuid=a.uuid||offlineUuid(a.username);const span=document.getElementById('activeUuidText');const done=()=>{uuidBtn.classList.add('copied');if(span)span.textContent='Copied!';setTimeout(()=>{uuidBtn.classList.remove('copied');if(span)span.textContent=uuid;},1200);};if(navigator.clipboard)navigator.clipboard.writeText(uuid).then(done).catch(done);else done();});

// ── Launcher notice sign in button ────────────────────────────
const noticeBtn=document.getElementById('noticeSignInBtn');
if(noticeBtn)noticeBtn.addEventListener('click',()=>openDashboard());
// ══════════════════════════════════════════════════════════════
// SITE ACCOUNT DASHBOARD MODAL
// ══════════════════════════════════════════════════════════════
const dashOverlay  = document.getElementById('dashboardOverlay');
const authView     = document.getElementById('authView');
const registerView = document.getElementById('registerView');
const profileView  = document.getElementById('profileView');
const recoveryView = document.getElementById('recoveryView');
const dashboardViews = [authView, registerView, profileView, recoveryView].filter(Boolean);
let dashboardOpenFrame = 0;

function showDashboardView(activeView) {
    dashboardViews.forEach(view => {
        const active = view === activeView;
        view.hidden = !active;
        view.style.removeProperty('display');
        view.setAttribute('aria-hidden', String(!active));
    });
}

function revealDashboard() {
    if (!dashOverlay || dashOverlay.classList.contains('open') || dashboardOpenFrame) return;
    document.body.style.overflow = 'hidden';
    dashboardOpenFrame = requestAnimationFrame(() => {
        dashboardOpenFrame = 0;
        dashOverlay.classList.add('open');
    });
}

function setProfileModalWide(wide) {
    const modal = dashOverlay && dashOverlay.querySelector('.dashboard-modal');
    if (modal) modal.classList.toggle('profile-wide', !!wide);
}

function openDashboard() {
    if (!dashOverlay) return;
    if (currentUserId) showProfileView();
    else showAuthView();
    revealDashboard();
}
function closeDashboard() {
    if (!dashOverlay) return;
    if (dashboardOpenFrame) {
        cancelAnimationFrame(dashboardOpenFrame);
        dashboardOpenFrame = 0;
    }
    dashOverlay.classList.remove('open');
    syncBodyScrollLock();
    const modal = dashOverlay.querySelector('.dashboard-modal');
    if (modal) modal.classList.remove('profile-replay', 'profile-opening', 'dashboard-morphing');
    const studio=document.getElementById('profileIdentityStudio');
    if(studio){
        studio.classList.remove('open');
        studio.hidden=true;
    }
}
function showAuthView() { setProfileModalWide(false); showDashboardView(authView); }
function showRegisterView() { setProfileModalWide(false); showDashboardView(registerView); }
function showRecoveryView() { setProfileModalWide(false); showDashboardView(recoveryView); revealDashboard(); }
function showProfileView() {
    const user = siteUsers.find(u=>u.id===currentUserId);
    if (!user) return;
    setProfileModalWide(true);
    showDashboardView(profileView);
    const canAdmin = canAccessAdmin(user);
    const adminTab = document.getElementById('adminPanelTab');
    if (adminTab) {
        adminTab.hidden = !canAdmin;
        adminTab.style.removeProperty('display');
    }
    loadProfileViewData(user, { resetTab: false });
    activateProfileTabV2('my-profile');
    const modal = dashOverlay.querySelector('.dashboard-modal');
    if (modal) modal.scrollTop = 0;
    triggerProfileMenuEntrance(user, false);
}

document.getElementById('openDashboardBtn').addEventListener('click', openDashboard);
const closeDashBtn = document.getElementById('closeDashboardBtn');
if (closeDashBtn) closeDashBtn.addEventListener('click', closeDashboard);
if (dashOverlay) dashOverlay.addEventListener('click', e=>{ if(e.target===dashOverlay)closeDashboard(); });

document.getElementById('switchToRegisterBtn')&&document.getElementById('switchToRegisterBtn').addEventListener('click',showRegisterView);
document.getElementById('switchToLoginBtn')&&document.getElementById('switchToLoginBtn').addEventListener('click',showAuthView);

// ══════════════════════════════════════════════════════════════
// SUPABASE AUTH  (nickname, email, Google and password recovery)
// Layered on top of the local system: when the Supabase client is
// available, these provide real authentication; otherwise everything
// falls back to the legacy username/password records on this device.
// ══════════════════════════════════════════════════════════════
const authAvailable = () => !!(cloud && cloud.auth);
const isFileProtocol = location.protocol === 'file:'; // OAuth/email links need http(s)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function updateAuthModeUi(){
    const connected=authAvailable();
    const configured=validSupabaseConfig();
    const note=document.getElementById('authModeNote');
    if(note){
        note.classList.toggle('is-cloud',connected);
        const icon=note.querySelector('i');if(icon)icon.className=connected?'fas fa-shield-halved':'fas fa-hard-drive';
        const text=note.querySelector('span');if(text)text.textContent=connected
            ? 'Authenticated mode: remote data is limited to your account by Row Level Security.'
            : configured?'Connection unavailable. Reconnect to sign in to your cloud account.':'Local demo mode: account data stays in this browser. Do not reuse a password from another service.';
    }
    const email=document.getElementById('regEmail');if(email){email.required=false;email.placeholder=' ';}
    const emailLabel=document.querySelector('label[for="regEmail"]');if(emailLabel)emailLabel.textContent=configured?'Email address (optional)':'Email saved only on this device (optional)';
    const emailHint=document.getElementById('regEmailHintText');if(emailHint)emailHint.textContent=configured?'Leave this blank to create an account with only a username and password. Without email, password recovery is unavailable.':'Without configured cloud authentication, this creates a device-local demo account only.';
    const loginLabel=document.querySelector('label[for="loginInput"]');if(loginLabel)loginLabel.textContent='Email or username';
    const providerHint=document.getElementById('authProviderHint');if(providerHint)providerHint.hidden=!configured;
    ['googleLoginBtn','googleRegisterBtn','forgotPasswordBtn'].forEach(id=>{const button=document.getElementById(id);if(button)button.hidden=!configured;});
}
updateAuthModeUi();
function todayStr(){ const d=new Date(); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`; }
function authMsg(id,msg){ const el=document.getElementById(id); if(el){ el.textContent=msg; el.style.display='block'; } }
function clearAuthMsgs(){ ['loginError','loginNote','registerError','registerNote','recoveryError','recoveryNote'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';}); }
function authRedirectTo(){ return location.origin + location.pathname; }
async function usernameAuth(action, username, password){
    const response=await fetch(`${SUPABASE_URL}/functions/v1/username-auth`,{
        method:'POST',
        headers:{'Content-Type':'application/json',apikey:SUPABASE_PUBLIC_KEY},
        body:JSON.stringify({action,username,password})
    });
    let result={};
    try{result=await response.json();}catch{}
    if(!response.ok)throw new Error(result.error||'Account service unavailable. Try again.');
    if(!result.access_token||!result.refresh_token)throw new Error('Account service returned an incomplete session.');
    const {data,error}=await cloud.auth.setSession({access_token:result.access_token,refresh_token:result.refresh_token});
    if(error||!data?.user)throw new Error('Sign-in could not be completed. Try again.');
    await restoreVerifiedAccount(data.user);
}

// Find-or-create the local/cloud profile row for a Supabase Auth user.
let freshAuthProfileId = null;
function ensureProfileFor(authUser){
    let u = siteUsers.find(x=>x.id===authUser.id);
    if(!u){
        const meta = authUser.user_metadata || {};
        const uname = sanitizeField(meta.username || meta.full_name || (authUser.email||'player').split('@')[0], 20) || 'player';
        u = { id:authUser.id, username:uname, email:/@users\.spectral\.invalid$/i.test(authUser.email||'')?'':sanitizeField(authUser.email,254), password:'', role:'USER',
              displayName: sanitizeField(meta.full_name||uname,24)||uname, bio:'Minecraft player',
              avatar: safeAvatarUrl(meta.avatar_url||meta.picture), registeredAt:todayStr(),
              totalTimeSec:0, visitCount:0, lastSeen:new Date().toISOString(), banned:false,
              status:'', mcTimeSec:0 };
        siteUsers.push(u); saveSiteUsers(siteUsers);
        saveMcAccounts(u.id,[]); saveActiveMc(u.id,'');
        freshAuthProfileId = u.id;
    } else if(authUser.email && !/@users\.spectral\.invalid$/i.test(authUser.email) && u.email!==authUser.email){
        u.email = authUser.email; saveSiteUsers(siteUsers);
    }
    return u;
}
// Apply a verified Supabase session to the app.
function applyAuthUser(authUser){
    if(!authUser) return false;
    const profile = ensureProfileFor(authUser);
    if(profile.banned){ if(authAvailable())cloud.auth.signOut().catch(error=>console.warn('[auth] sign out failed:',error.message||error)); authMsg('loginError','This account has been banned'); return false; }
    currentUserId = profile.id; saveSession(profile.id);
    clearAuthMsgs(); beginUserSession(); renderAll();
    if(dashOverlay && dashOverlay.classList.contains('open')) showProfileView();
    let newGoogleRegistration=false,confirmedEmailRegistration=false;
    try{
        const started=Number(sessionStorage.getItem('spectral_google_registration')||0);
        newGoogleRegistration=started>0&&Date.now()-started<10*60*1000&&Math.abs(new Date(authUser.created_at).getTime()-started)<10*60*1000;
        if(started)sessionStorage.removeItem('spectral_google_registration');
        const pending=JSON.parse(sessionStorage.getItem('spectral_pending_email_registration')||'null');
        confirmedEmailRegistration=pending?.id===profile.id&&Date.now()-pending.at<48*60*60*1000;
        if(confirmedEmailRegistration||pending?.at&&Date.now()-pending.at>=48*60*60*1000)sessionStorage.removeItem('spectral_pending_email_registration');
    }catch{}
    if(freshAuthProfileId===profile.id||newGoogleRegistration||confirmedEmailRegistration){freshAuthProfileId=null;showRegistrationWelcome(profile);}
    return true;
}
let authGeneration=0;
let authRestorePromise=null;
function clearAccountSession(){
    authGeneration++;stopTimeTracking();_visitBumpedFor=null;
    profileDrafts.clear();cloudAuthUserId=null;currentUserId=null;saveSession(null);
    siteUsers.forEach(user=>{user.pendingAvatar='';});
    adminCloudIds.clear();adminRemoteAudit=[];
    if(validSupabaseConfig())loadCommunityCloud();
    closeRoleCheckout();adminSelectedUserIds.clear();cancelAdminAction();
    renderAll();if(dashOverlay?.classList.contains('open'))showAuthView();
}
async function signOutAccount(){
    const button=document.getElementById('logoutBtn');if(button.disabled)return;button.disabled=true;
    const remote=currentUserId===cloudAuthUserId&&authAvailable();
    try{
        if(remote){const {error}=await cloud.auth.signOut();if(error)throw error;}
        clearAccountSession();showAuthView();showToast('Signed out.','right-from-bracket');
    }catch{showToast('Sign-out failed. Check your connection and try again.','triangle-exclamation');}
    finally{button.disabled=false;}
}
async function restoreVerifiedAccount(authUser){
    if(authRestorePromise)return authRestorePromise;
    const generation=authGeneration;
    authRestorePromise=(async()=>{
        cloudAuthUserId=authUser.id;
        const synced=await cloudBootstrap(authUser);
        if(generation!==authGeneration)return false;
        if(!synced){cloudAuthUserId=null;throw new Error('Account data could not be verified. Please retry.');}
        await loadCommunityCloud();
        return applyAuthUser(authUser);
    })();
    try{return await authRestorePromise;}finally{authRestorePromise=null;}
}
async function initSupabaseAuth(){
    await initCloudClient();updateAuthModeUi();if(!authAvailable())return;
    cloud.auth.onAuthStateChange((event,session)=>{
        if(event==='SIGNED_OUT'){clearAccountSession();return;}
        // Defer auth API work until outside the Supabase callback/lock.
        if(event==='PASSWORD_RECOVERY'){cloudAuthUserId=session?.user?.id||null;showRecoveryView();return;}
        if(event==='SIGNED_IN'&&session?.user)setTimeout(()=>{
            if(currentUserId===session.user.id)return;
            restoreVerifiedAccount(session.user).catch(error=>authMsg('loginError',error.message));
        },0);
    });
    try{const {data,error}=await cloud.auth.getSession();if(error)throw error;if(data?.session?.user)await restoreVerifiedAccount(data.session.user);else await loadCommunityCloud();}catch(error){authMsg('loginError',error.message||'Session could not be restored.');}
    if(/type=recovery/.test(location.hash))showRecoveryView();
}

// ── Login ─────────────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const login = document.getElementById('loginInput').value.trim();
        const pass  = document.getElementById('passwordInput').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        clearAuthMsgs();
        const fail  = msg => authMsg('loginError', msg||'Invalid email/username or password');

        if (!login || !pass) return fail('Enter your email or username and password.');
        if(submitBtn?.disabled)return;
        if(submitBtn)submitBtn.disabled=true;
        try {
            if(validSupabaseConfig()&&!authAvailable()){fail('Connection unavailable. Please reconnect.');return;}
            if (authAvailable()) {
                if(EMAIL_RE.test(login)){
                    const { data, error } = await cloud.auth.signInWithPassword({ email:login, password:pass });
                    if(error){fail();return;}
                    await restoreVerifiedAccount(data.user);
                }else{
                    await usernameAuth('login',login,pass);
                }
                return;
            }
            // Legacy local path (username or email stored in our table)
            const normalizedLogin=login.toLowerCase();
            const user = siteUsers.find(u=>u.username.toLowerCase()===normalizedLogin || (u.email&&u.email.toLowerCase()===normalizedLogin));
            let ok = false;
            if (user && user.password) {
                if (looksHashed(user.password)) ok = (await hashPassword(pass)) === user.password;
                else { ok = (user.password === pass); if (ok){ user.password = await hashPassword(pass); saveSiteUsers(siteUsers); } }
            }
            if (!ok) { fail(); return; }
            if (user.banned) { fail('This account has been banned'); return; }
            currentUserId=user.id; saveSession(user.id);
            beginUserSession(); renderAll(); showProfileView();
        } catch (error) {
            console.warn('[auth] sign in failed:', error.message||error);
            const message=error?.message==='Incorrect username or password. If you used Google, choose Google sign-in.'
                ? error.message:'Sign-in is temporarily unavailable. Please try again.';
            fail(message);
        } finally {
            if(submitBtn)submitBtn.disabled=false;
        }
    });
}

// ── Register ──────────────────────────────────────────────────
const registerForm = document.getElementById('registerForm');
if(registerForm){
    registerForm.addEventListener('submit',async event=>{
        event.preventDefault();const button=registerForm.querySelector('button[type="submit"]');if(button.disabled)return;
        clearAuthMsgs();const showErr=message=>authMsg('registerError',message);
        const username=sanitizeField(document.getElementById('regUsername').value,20);
        const email=document.getElementById('regEmail').value.trim();
        const pass=document.getElementById('regPassword').value,confirm=document.getElementById('regPasswordConfirm').value;
        const minLen=10;
        if(username.length<3||! /^[A-Za-z0-9 _.\-]+$/.test(username))return showErr('Use 3–20 letters, numbers, spaces or _ . - for your username.');
        const nameIssue=AccountPolicy.nameIssue(username);if(nameIssue)return showErr(nameIssue);
        if(email&&!EMAIL_RE.test(email))return showErr('Enter a valid email address or leave the field empty.');
        if(pass.length<minLen||pass.length>128)return showErr('Use a password with 10–128 characters.');
        if(pass!==confirm)return showErr('Passwords do not match.');
        if(validSupabaseConfig()&&!authAvailable())return showErr('Connection unavailable. Reconnect to create your account.');
        if(!validSupabaseConfig()&&siteUsers.some(user=>user.username.toLowerCase()===username.toLowerCase()||(email&&user.email?.toLowerCase()===email.toLowerCase())))return showErr('This username or email is already used on this device.');
        button.disabled=true;
        try{
            if(validSupabaseConfig()&&!email){
                await usernameAuth('register',username,pass);
                registerForm.reset();
                if(currentRoleUser())showRegistrationWelcome(currentRoleUser());
            }else if(validSupabaseConfig()){
                const {data,error}=await cloud.auth.signUp({email,password:pass,options:{data:{username},emailRedirectTo:authRedirectTo()}});
                if(error)throw new Error('Account could not be created. Check your details and try again.');
                registerForm.reset();
                if(data.session&&data.user){await restoreVerifiedAccount(data.user);if(currentRoleUser())showRegistrationWelcome(currentRoleUser());}
                else{
                    authMsg('registerNote','Check your inbox to confirm your email, then sign in.');
                    if(data.user?.id)try{sessionStorage.setItem('spectral_pending_email_registration',JSON.stringify({id:data.user.id,at:Date.now()}));}catch{}
                }
            }else{
                const user={id:'su_'+crypto.randomUUID().replace(/-/g,''),username,email,password:await hashPassword(pass),role:roleForRegistration(),roleSource:'registration',displayName:username,bio:'',avatar:'',registeredAt:todayStr(),totalTimeSec:0,visitCount:0,lastSeen:new Date().toISOString(),banned:false,status:'',mcTimeSec:0};
                if(!saveSiteUsers([...siteUsers,user]))throw new Error('This browser cannot save your account. Free some storage and try again.');
                siteUsers.push(user);saveMcAccounts(user.id,[]);currentUserId=user.id;saveSession(user.id);beginUserSession();registerForm.reset();renderAll();showProfileView();showRegistrationWelcome(user);
            }
        }catch(error){showErr(error.message||'Account could not be created. Try again.');}
        finally{button.disabled=false;}
    });
}

// ── Google sign-in (login + register buttons) ─────────────────
async function startGoogleSignIn(event){
    clearAuthMsgs();
    if(isFileProtocol){ authMsg('loginError','Google sign-in needs the site served over http(s) — use a local server or GitHub Pages, not a file:// page.'); return; }
    if(!authAvailable()){ authMsg('loginError','Google sign-in is unavailable (Supabase not connected).'); return; }
    try {
        if(event?.currentTarget?.id==='googleRegisterBtn')try{sessionStorage.setItem('spectral_google_registration',String(Date.now()));}catch{}
        const { error } = await cloud.auth.signInWithOAuth({
            provider:'google',
            options:{ redirectTo: authRedirectTo(), queryParams:{ prompt:'select_account' } }
        });
        if(error){try{sessionStorage.removeItem('spectral_google_registration');}catch{}authMsg('loginError', error.message);}
    } catch (error) {
        try{sessionStorage.removeItem('spectral_google_registration');}catch{}
        console.warn('[auth] Google sign in failed:', error.message||error);
        authMsg('loginError','Google sign-in is temporarily unavailable. Please try again.');
    }
}
['googleLoginBtn','googleRegisterBtn'].forEach(id=>{ const b=document.getElementById(id); if(b)b.addEventListener('click',startGoogleSignIn); });

// ── Forgot password ───────────────────────────────────────────
const forgotBtn = document.getElementById('forgotPasswordBtn');
if(forgotBtn){
    forgotBtn.addEventListener('click', async ()=>{
        clearAuthMsgs();
        const email=(document.getElementById('loginInput').value||'').trim();
        if(!EMAIL_RE.test(email)){ authMsg('loginError','Password recovery needs a real email. For a username-only account, keep your password safe; Google accounts should use Google sign-in.'); document.getElementById('loginInput').focus(); return; }
        if(isFileProtocol){ authMsg('loginError','Password recovery needs the site served over http(s), not a file:// page.'); return; }
        if(!authAvailable()){ authMsg('loginError','Password recovery is unavailable (Supabase not connected).'); return; }
        try {
            const { error } = await cloud.auth.resetPasswordForEmail(email, { redirectTo: authRedirectTo() });
            if(error) console.warn('[auth] recovery request was not accepted:', error.message||error);
            authMsg('loginNote','If an account exists for that email, a recovery link will arrive shortly.');
        } catch (error) {
            console.warn('[auth] password recovery failed:', error.message||error);
            authMsg('loginNote','If an account exists for that email, a recovery link will arrive shortly.');
        }
    });
}

// ── Recovery form (set a new password) ────────────────────────
const recoveryForm = document.getElementById('recoveryForm');
if(recoveryForm){
    recoveryForm.addEventListener('submit', async e=>{
        e.preventDefault();
        clearAuthMsgs();
        const p1=document.getElementById('recoveryPassword').value;
        const p2=document.getElementById('recoveryPasswordConfirm').value;
        if(!p1||p1.length<10||p1.length>128) return authMsg('recoveryError','Password must be at least 10 characters');
        if(p1!==p2) return authMsg('recoveryError','Passwords do not match');
        if(!authAvailable()) return authMsg('recoveryError','Recovery is unavailable (Supabase not connected).');
        try {
            const { error } = await cloud.auth.updateUser({ password:p1 });
            if(error) return authMsg('recoveryError', error.message);
            recoveryForm.reset();
            authMsg('recoveryNote','Password updated! Signing you in…');
            const { data } = await cloud.auth.getSession();
            if(data?.session?.user)await restoreVerifiedAccount(data.session.user);
        } catch (error) {
            console.warn('[auth] password update failed:', error.message||error);
            authMsg('recoveryError','Password update is temporarily unavailable. Please try again.');
        }
    });
}
// ── Profile tabs ──────────────────────────────────────────────
// Expand the dashboard window when the Admin panel is open (more room for data),
// collapse back to the compact width for the regular profile view.
function setDashboardWide(mode) {
    const modal = dashOverlay && dashOverlay.querySelector('.dashboard-modal');
    if (!modal) return;
    const adminMode = mode === 'admin' || mode === true;
    const storeMode = mode === 'store';
    const unchanged = modal.classList.contains('admin-wide') === adminMode && modal.classList.contains('store-wide') === storeMode;
    if (unchanged) return;
    modal.classList.remove('workspace-morphing');
    modal.classList.toggle('admin-wide', adminMode);
    modal.classList.toggle('store-wide', storeMode);
    if (!REDUCED_MOTION && !liteOn()) {
        requestAnimationFrame(() => {
            modal.classList.add('workspace-morphing');
            window.setTimeout(() => modal.classList.remove('workspace-morphing'), 640);
        });
    }
}

const profileTabsRoot = document.getElementById('profileTabs');
const profileTabButtons = profileTabsRoot ? [...profileTabsRoot.querySelectorAll('.profile-tab')] : [];
const profileTabPanels = profileView ? [...profileView.querySelectorAll(':scope > .ptab-content')] : [];
const profilePanelAnimationCleanup = new WeakMap();

function syncProfileTabIndicator(activeTab) {
    if (!profileTabsRoot) return;
    const tabs = profileTabButtons.filter(tab=>!tab.hidden && getComputedStyle(tab).display !== 'none');
    const selected = activeTab || tabs.find(tab=>tab.classList.contains('active'));
    const index = Math.max(0, tabs.indexOf(selected));
    profileTabsRoot.style.setProperty('--tab-count', String(Math.max(1, tabs.length)));
    profileTabsRoot.style.setProperty('--tab-index', String(index));
    profileTabsRoot.style.setProperty('--tab-offset', `${index * 100}%`);
}

function stopProfilePanelAnimation(panel) {
    const cleanup = profilePanelAnimationCleanup.get(panel);
    if (cleanup) cleanup();
}

function playProfilePanelEntrance(panel) {
    if (!panel || REDUCED_MOTION || liteOn()) return;
    stopProfilePanelAnimation(panel);
    panel.classList.remove('ptab-enter');
    const onEnd = event => {
        if (event.target !== panel) return;
        panel.removeEventListener('animationend', onEnd);
        panel.classList.remove('ptab-enter');
        profilePanelAnimationCleanup.delete(panel);
    };
    const cleanup = () => {
        panel.removeEventListener('animationend', onEnd);
        panel.classList.remove('ptab-enter');
        profilePanelAnimationCleanup.delete(panel);
    };
    profilePanelAnimationCleanup.set(panel, cleanup);
    requestAnimationFrame(() => {
        if (panel.hidden) return cleanup();
        panel.addEventListener('animationend', onEnd);
        panel.classList.add('ptab-enter');
    });
}

function activateProfileTab(target, { animate = true, refresh = true } = {}) {
    if(target==='admin-panel'&&!canAccessAdmin(currentRoleUser()))return;
    const selectedTab = profileTabButtons.find(tab => tab.dataset.ptab === target && !tab.hidden);
    if (!selectedTab) return;
    const currentTab = profileTabButtons.find(tab => tab.classList.contains('active'));
    const isSameTab = currentTab === selectedTab;

    profileTabButtons.forEach(tab => {
        const active = tab === selectedTab;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.setAttribute('tabindex', active ? '0' : '-1');
    });

    profileTabPanels.forEach(panel => {
        const active = panel.dataset.ptabContent === target;
        if (!active) stopProfilePanelAnimation(panel);
        panel.hidden = !active;
        panel.style.removeProperty('display');
        panel.classList.toggle('active', active);
        panel.setAttribute('aria-hidden', String(!active));
        if (active && animate && !isSameTab) playProfilePanelEntrance(panel);
    });

    const mode = target === 'admin-panel' ? 'admin' : target === 'role-store' ? 'store' : false;
    const modal = dashOverlay?.querySelector('.dashboard-modal');
    if (modal) modal.dataset.workspace = target;
    setDashboardWide(mode);
    syncProfileTabIndicator(selectedTab);

    if (!refresh || isSameTab) return;
    if (target === 'admin-panel') renderAdminPanel();
    if (target === 'role-store') renderRoleStore();
    if (target === 'my-profile') {
        const user = currentRoleUser();
        if (user) loadProfileViewData(user, { resetTab: false });
    }
}

const PROFILE_HEADERS = {
    nebula:   { label:'Nebula Drift',      tier:'Core collection',      unlock:'USER',      icon:'fas fa-cloud-moon', description:'Indigo starlight with quiet drifting orbits.' },
    archive:  { label:'Veteran Archive',   tier:'Founder collection',   unlock:'VETERAN',   icon:'fas fa-shield-halved', description:'Layered jade contours and a soft founder glow.' },
    solar:    { label:'Solar Flux',         tier:'Pro collection',       unlock:'PRO',       icon:'fas fa-sun', description:'Warm horizon light across a deep dusk field.' },
    crown:    { label:'Violet Crown',       tier:'Legend collection',    unlock:'LEGEND',    icon:'fas fa-crown', description:'Violet depth with fine refracted light.' },
    prism:    { label:'Spectral Prism',     tier:'Signature identity',   unlock:'SPECTRAL',  icon:'fas fa-gem', description:'Cyan, violet and rose light crossing in fine planes.' },
    guardian: { label:'Guardian Grid',      tier:'Staff collection',     unlock:'MODERATOR', icon:'fas fa-gavel', description:'Cool blue signal lines with a steady glow.' },
    command:  { label:'Command Core',       tier:'Admin collection',     unlock:'ADMIN',     icon:'fas fa-user-shield', description:'Rose red scanlines over a dark command field.' },
    code:     { label:'Developer Protocol', tier:'Internal build',       unlock:'DEV',       icon:'fas fa-code', description:'Rose and cyan traces across a quiet developer field.' }
};
const PROFILE_ENTRANCES = {
    signal:   { label:'Soft signal',   unlock:'USER',     icon:'fas fa-wave-square' },
    aurora:   { label:'Aurora rise',   unlock:'VETERAN',  icon:'fas fa-water' },
    portal:   { label:'Portal fold',   unlock:'PRO',      icon:'fas fa-circle-notch' },
    stardust: { label:'Stardust',      unlock:'LEGEND',   icon:'fas fa-star' },
    rift:     { label:'Prism rift',    unlock:'SPECTRAL', icon:'fas fa-wand-magic-sparkles' },
    terminal: { label:'Terminal boot', unlock:'DEV',      icon:'fas fa-terminal' }
};
const ROLE_DEFAULT_HEADERS={USER:'nebula',VETERAN:'archive',PRO:'solar',LEGEND:'crown',SPECTRAL:'prism',MODERATOR:'guardian',ADMIN:'command',DEV:'code'};
const ROLE_DEFAULT_ENTRANCES={USER:'signal',VETERAN:'aurora',PRO:'portal',LEGEND:'stardust',SPECTRAL:'rift',MODERATOR:'portal',ADMIN:'rift',DEV:'terminal'};
function profilePresetUnlocked(user,preset){return !!user&&!!preset&&(isDev(user)||roleRank(user.role)>=roleRank(preset.unlock));}
function profileStyleFor(user){
    const styles=loadProfileStyles();const saved=styles[user.id]||{};const displayRole=displayedRoleKey(user);
    let header=PROFILE_HEADERS[saved.header]&&profilePresetUnlocked(user,PROFILE_HEADERS[saved.header])?saved.header:ROLE_DEFAULT_HEADERS[displayRole]||'nebula';
    let entrance=PROFILE_ENTRANCES[saved.entrance]&&profilePresetUnlocked(user,PROFILE_ENTRANCES[saved.entrance])?saved.entrance:ROLE_DEFAULT_ENTRANCES[displayRole]||'signal';
    if(!profilePresetUnlocked(user,PROFILE_HEADERS[header]))header='nebula';
    if(!profilePresetUnlocked(user,PROFILE_ENTRANCES[entrance]))entrance='signal';
    return {header,entrance};
}
function saveProfileStyle(user,patch){
    if(!user)return;const styles=loadProfileStyles();styles[user.id]={...profileStyleFor(user),...(styles[user.id]||{}),...patch};saveProfileStyles(styles);
}
function renderProfileIdentityStudio(user){
    const style=profileStyleFor(user);
    const studio=document.getElementById('profileIdentityStudio');
    const renderKey=`${user.id}:${displayedRoleKey(user)}:${style.header}:${style.entrance}`;
    if(studio?.dataset.renderKey===renderKey)return;
    const options=document.getElementById('profileHeaderOptions');
    if(options)options.innerHTML=Object.entries(PROFILE_HEADERS).map(([key,preset])=>{
        const unlocked=profilePresetUnlocked(user,preset);const active=style.header===key;
        return `<button type="button" class="profile-header-option ${active?'active':''} ${unlocked?'':'locked'}" data-header-choice="${key}" ${unlocked?'':`disabled title="Unlock with ${ROLES[preset.unlock].label}"`}><span class="profile-header-option-preview" data-preview-header="${key}"><i></i><b></b></span><span><small>${unlocked?'Animated header':`Requires ${ROLES[preset.unlock].label}`}</small><strong><i class="${preset.icon}"></i>${preset.label}</strong><em>${preset.description}</em></span>${unlocked?'<i class="fas fa-check"></i>':'<i class="fas fa-lock"></i>'}</button>`;
    }).join('');
    const entrances=document.getElementById('profileEntranceOptions');
    if(entrances)entrances.innerHTML=Object.entries(PROFILE_ENTRANCES).map(([key,preset])=>{
        const unlocked=profilePresetUnlocked(user,preset);return `<button type="button" class="${style.entrance===key?'active':''}" data-entrance-choice="${key}" ${unlocked?'':`disabled title="Requires ${ROLES[preset.unlock].label}"`}><i class="${unlocked?preset.icon:'fas fa-lock'}"></i><span>${preset.label}</span></button>`;
    }).join('');
    if(studio)studio.dataset.renderKey=renderKey;
}

function animateProfileHeader(cover){
    if(!cover||REDUCED_MOTION||liteOn())return;
    if(cover._headerAnimationEnd)cover.removeEventListener('animationend',cover._headerAnimationEnd);
    if(cover._headerAnimationFrame)cancelAnimationFrame(cover._headerAnimationFrame);
    cover.classList.remove('header-switching');
    const finish=event=>{
        if(event.target!==cover)return;
        cover.removeEventListener('animationend',finish);
        cover.classList.remove('header-switching');
        cover._headerAnimationEnd=null;
    };
    cover._headerAnimationEnd=finish;
    cover._headerAnimationFrame=requestAnimationFrame(()=>{
        cover._headerAnimationFrame=0;
        cover.addEventListener('animationend',finish);
        cover.classList.add('header-switching');
    });
}

function applyProfileStyle(user,{animateHeader=false,refreshStudio=false}={}){
    if(!user)return;const style=profileStyleFor(user);const preset=PROFILE_HEADERS[style.header];const entrance=PROFILE_ENTRANCES[style.entrance];
    const cover=document.getElementById('profileCover');
    if(cover){
        const headerChanged=cover.dataset.header!==style.header;
        cover.dataset.header=style.header;
        if(animateHeader&&headerChanged)animateProfileHeader(cover);
    }
    const title=document.getElementById('profileHeaderTitle');if(title)title.textContent=preset.label;
    const icon=document.getElementById('profileHeaderIcon');if(icon)icon.className=preset.icon;
    const tier=document.getElementById('profileHeaderTier');if(tier)tier.textContent=preset.tier||'Role collection';
    const signal=document.getElementById('profileSignalName');if(signal)signal.textContent=entrance.label;
    const entranceTitle=document.getElementById('profileEntranceTitle');if(entranceTitle)entranceTitle.textContent=entrance.label;
    const unlockedCount=Object.values(PROFILE_HEADERS).filter(item=>profilePresetUnlocked(user,item)).length;
    const access=document.getElementById('profileHeaderAccess');if(access)access.textContent=`${unlockedCount} animated ${unlockedCount===1?'header':'headers'} unlocked`;
    const modal=dashOverlay?.querySelector('.dashboard-modal');if(modal)modal.dataset.entrance=style.entrance;
    const studio=document.getElementById('profileIdentityStudio');
    if(refreshStudio||(studio&&!studio.hidden))renderProfileIdentityStudio(user);
}

function triggerProfileMenuEntrance(user,replay=true){
    const modal=dashOverlay?.querySelector('.dashboard-modal');if(!modal||!user)return;modal.dataset.entrance=profileStyleFor(user).entrance;
    modal.classList.remove('profile-opening');
    if(!replay||REDUCED_MOTION||liteOn())return;
    if(modal._profileReplayEnd)modal.removeEventListener('animationend',modal._profileReplayEnd);
    if(modal._profileReplayFrame)cancelAnimationFrame(modal._profileReplayFrame);
    modal.classList.remove('profile-replay');
    const finish=event=>{
        if(event.target!==modal)return;
        modal.removeEventListener('animationend',finish);
        modal.classList.remove('profile-replay');
        modal._profileReplayEnd=null;
    };
    modal._profileReplayEnd=finish;
    modal._profileReplayFrame=requestAnimationFrame(()=>{
        modal._profileReplayFrame=0;
        modal.addEventListener('animationend',finish);
        modal.classList.add('profile-replay');
    });
}
function openProfileIdentityStudio(){
    const studio=document.getElementById('profileIdentityStudio');const user=currentRoleUser();if(!studio||!user)return;
    if(studio._finishClose){
        studio.removeEventListener('transitionend',studio._finishClose);
        studio._finishClose=null;
    }
    renderProfileIdentityStudio(user);
    studio.hidden=false;
    requestAnimationFrame(()=>{
        studio.classList.add('open');
        studio.scrollIntoView({behavior:'auto',block:'nearest'});
    });
}
function closeProfileIdentityStudio(){
    const studio=document.getElementById('profileIdentityStudio');if(!studio)return;
    studio.classList.remove('open');
    if(studio._finishClose)studio.removeEventListener('transitionend',studio._finishClose);
    const finish=event=>{
        if(event&&event.target!==studio)return;
        if(event&&event.propertyName!=='opacity')return;
        studio.removeEventListener('transitionend',finish);
        studio._finishClose=null;
        if(!studio.classList.contains('open'))studio.hidden=true;
    };
    studio._finishClose=finish;
    if(REDUCED_MOTION||liteOn())finish();
    else studio.addEventListener('transitionend',finish);
}
document.getElementById('openHeaderStudioBtn')?.addEventListener('click',openProfileIdentityStudio);
document.getElementById('closeHeaderStudioBtn')?.addEventListener('click',closeProfileIdentityStudio);
document.getElementById('profileHeaderOptions')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-header-choice]');const user=currentRoleUser();if(!button||button.disabled||!user)return;saveProfileStyle(user,{header:button.dataset.headerChoice});applyProfileStyle(user,{animateHeader:true,refreshStudio:true});showToast(`${PROFILE_HEADERS[button.dataset.headerChoice].label} header equipped.`,'wand-magic-sparkles');
});
document.getElementById('profileEntranceOptions')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-entrance-choice]');const user=currentRoleUser();if(!button||button.disabled||!user)return;saveProfileStyle(user,{entrance:button.dataset.entranceChoice});applyProfileStyle(user,{refreshStudio:true});triggerProfileMenuEntrance(user,true);showToast(`${PROFILE_ENTRANCES[button.dataset.entranceChoice].label} entrance selected.`,'wave-square');
});

// ── Load profile data ─────────────────────────────────────────
function loadProfileViewData(user,{resetTab=false}={}) {
    const displayRole=displayedRoleKey(user);
    const role = roleInfo(user.role);
    const displayRoleInfo=roleInfo(displayRole);
    const draft=profileDraftFor(user);
    const img = document.getElementById('profileAvatarImg');
    if(img){img.src=draft.avatar||siteAvatarUrl({...user,avatar:''});img.onerror=function(){this.onerror=null;this.src='assets/avatar-placeholder.svg';};}
    const un = document.getElementById('profileUsername'); if(un)un.textContent=user.displayName||user.username;
    const rb = document.getElementById('profileRoleBadge'); if(rb){rb.innerHTML=`<i class="${displayRoleInfo.icon}"></i> ${displayRoleInfo.label}${isDev(user)&&displayRole!=='DEV'?'<small>VISUAL PREVIEW</small>':''}`;rb.className=`badge-pro profile-role-${String(displayRole).toLowerCase()}`;rb.style.background=displayRoleInfo.grad;rb.style.color='#fff';}
    const dn = document.getElementById('profileDisplayName'); if(dn)dn.value=draft.displayName;
    const st = document.getElementById('profileStatus'); if(st)st.value=draft.status;
    const bio= document.getElementById('profileBio'); if(bio)bio.value=draft.bio;
    const chips = document.getElementById('profileStatChips');
    if (chips) chips.innerHTML =
        `<span class="p-stat-chip"><i class="fas fa-gamepad"></i> ${formatMcTime(user.mcTimeSec)} <small>in Minecraft</small></span>`
      + `<span class="p-stat-chip"><i class="fas fa-clock"></i> ${formatDuration(user.totalTimeSec)} <small>on site</small></span>`
      + `<span class="p-stat-chip"><i class="fas fa-user-friends"></i> ${getFriends(user.id).length} <small>friends</small></span>`
      + `<span class="p-stat-chip role-limit-chip"><i class="fas fa-users-rectangle"></i> ${formatRoleLimit(roleProfileLimit(user.role))} <small>profile slots</small></span>`;
    const spotlight=document.getElementById('openRoleStoreBtn');
    if(spotlight){spotlight.style.setProperty('--spotlight-role',role.color);spotlight.dataset.role=String(displayRole).toLowerCase();}
    const spotlightIcon=document.getElementById('profileRoleSpotlightIcon');if(spotlightIcon){spotlightIcon.innerHTML=`<i class="${role.icon}"></i>`;spotlightIcon.style.background=role.grad;}
    const spotlightTitle=document.getElementById('profileRoleSpotlightTitle');if(spotlightTitle)spotlightTitle.textContent=`${role.label} role`;
    const spotlightText=document.getElementById('profileRoleSpotlightText');if(spotlightText)spotlightText.textContent=role.tagline;
    applyProfileStyle(user);
    updateProfileDraftState();
    renderAccountSession(user);
    if(resetTab){
        const activeSwitcher=globalThis.activateProfileTab;
        if(activeSwitcher&&activeSwitcher!==activateProfileTab)activeSwitcher('my-profile');
        else activateProfileTab('my-profile',{animate:false,refresh:false});
    }
}

// ── Roles, purchase-ready store and registration celebration ────────────────
const ROLE_STORE_PLANS = {
    PRO:      { monthly:4.99, yearly:47.90, kicker:'Player favorite', description:'More room for profiles with a warm gold identity across Spectral.' },
    LEGEND:   { monthly:8.99, yearly:86.30, kicker:'Most popular', description:'A rare violet presence, expanded capacity and earlier community visibility.' },
    SPECTRAL: { monthly:13.99, yearly:134.30, kicker:'Everything unlocked', description:'Unlimited identities and the complete prismatic Spectral treatment.' }
};
let roleBillingCycle='yearly';
let selectedCheckoutRole=null;
let checkoutQuote=null;
let checkoutCloseTimer=null;

function currentRoleUser(){ return siteUsers.find(user=>user.id===currentUserId) || null; }
function latestRoleOrder(userId,role){
    return loadRoleOrders().slice().reverse().find(order=>order.userId===userId&&order.role===role&&order.status==='reserved');
}
function openRoleStore(){
    if(!currentUserId){openDashboard();return;}
    if(!dashOverlay?.classList.contains('open'))openDashboard();
    document.querySelector('[data-ptab="role-store"]')?.click();
}
document.getElementById('openRoleStoreBtn')?.addEventListener('click',openRoleStore);

function rolePriceMarkup(role,veteranEligible=true){
    if(role==='VETERAN')return veteranEligible
        ? '<div class="role-card-price earned"><b>Earned</b><small>Permanent founder reward</small></div>'
        : '<div class="role-card-price"><b>Legacy</b><small>Founder window closed May 1, 2027</small></div>';
    const plan=ROLE_STORE_PLANS[role];
    if(!plan)return '';
    const value=roleBillingCycle==='yearly'?plan.yearly:plan.monthly;
    const suffix=roleBillingCycle==='yearly'?'/ year':'/ month';
    const equivalent=roleBillingCycle==='yearly'?`$${(plan.yearly/12).toFixed(2)} monthly equivalent`:'Cancel whenever payments launch';
    return `<div class="role-card-price"><b><sup>$</sup>${value.toFixed(2)}</b><small>${suffix} · ${equivalent}</small></div>`;
}

function renderRoleStore(){
    const user=currentRoleUser();
    const grid=document.getElementById('roleStoreGrid');
    if(!user||!grid)return;
    const displayRole=displayedRoleKey(user);
    const current=roleInfo(displayRole);
    const developerMode=isDev(user);
    const hero=document.getElementById('roleStoreHero');if(hero)hero.dataset.role=String(displayRole).toLowerCase();
    const icon=document.getElementById('currentRoleIcon');if(icon){icon.innerHTML=`<i class="${current.icon}"></i>`;icon.style.background=current.grad;}
    const name=document.getElementById('currentRoleName');if(name)name.textContent=current.label;
    const eyebrow=document.getElementById('currentRoleEyebrow');if(eyebrow)eyebrow.textContent=developerMode?'Developer is viewing':'Current role';
    const since=document.getElementById('currentRoleSince');
    if(since)since.textContent=developerMode&&displayRole!=='DEV'?'Preview only · Developer permissions stay active':displayRole==='VETERAN'?'Founder reward · permanent':`${current.tagline} · joined ${user.registeredAt||'recently'}`;
    const lab=document.getElementById('developerRoleLab');
    if(lab){
        lab.hidden=!developerMode;
        if(developerMode)lab.innerHTML=`<div class="developer-role-lab-icon"><i class="fas fa-flask-vial"></i><span></span></div><div><small>Developer Role Lab</small><h3>Inspect every role without losing developer access.</h3><p>The selected role changes badges, colors, limits and presentation for your account preview. Administration and developer permissions remain untouched.</p></div><div class="developer-role-lab-state"><small>Viewing now</small><b style="--lab-role:${current.color}"><i class="${current.icon}"></i>${current.label}</b><button type="button" data-reset-role-preview ${displayRole==='DEV'?'disabled':''}><i class="fas fa-rotate-left"></i> Reset to Developer</button></div>`;
    }
    const eligible=isVeteranEligible(user);
    const roleKeys=developerMode?ROLE_ORDER:['VETERAN',...PREMIUM_ROLES];
    grid.classList.toggle('developer-grid',developerMode);
    renderRoleWorkspace(user);
    grid.innerHTML=roleKeys.map((roleKey,index)=>{
        const info=roleInfo(roleKey);
        const isCurrent=displayRole===roleKey;
        const reserved=latestRoleOrder(user.id,roleKey);
        const lockedVeteran=!developerMode&&roleKey==='VETERAN'&&!isCurrent;
        const plan=ROLE_STORE_PLANS[roleKey];
        const state=isCurrent?'current':!developerMode&&reserved?'reserved':lockedVeteran?'locked':'';
        const buttonLabel=developerMode?(isCurrent?'Viewing this role':`Preview as ${info.label}`):(isCurrent?'Current role':reserved?'Reserved for launch':lockedVeteran?(eligible?'Assigned automatically':'Founder window closed'):'Choose role');
        const buttonIcon=isCurrent?'check':!developerMode&&reserved?'clock':lockedVeteran?'lock':developerMode?'eye':'arrow-right';
        const collection=developerMode?(roleRank(roleKey)>=ROLES.MODERATOR.rank?'Staff access':'Account role'):(roleKey==='VETERAN'?'Legacy collection':'Premium collection');
        const kicker=developerMode?'Developer preview':roleKey==='VETERAN'?'Never sold':esc(plan.kicker);
        const description=developerMode?info.tagline:(roleKey==='VETERAN'?'For every account registered before May 1, 2027.':plan.description);
        const price=developerMode?'<div class="role-card-price preview"><b>Live preview</b><small>Visual role only · permissions stay Developer</small></div>':rolePriceMarkup(roleKey,eligible);
        return `<article class="role-store-card role-card-${roleKey.toLowerCase()} ${state}" style="--role-color:${info.color};--role-gradient:${info.grad};--card-index:${index}" data-store-role="${roleKey}">
            <div class="role-card-shine"></div>
            <div class="role-card-top"><span class="role-card-icon"><i class="${info.icon}"></i></span><span class="role-card-kicker">${kicker}</span></div>
            <div class="role-card-title"><small>${collection}</small><h3>${esc(info.label)}</h3><p>${esc(description)}</p></div>
            ${price}
            <ul>${info.perks.map(perk=>`<li><i class="fas fa-check"></i>${esc(perk)}</li>`).join('')}</ul>
            <button type="button" class="role-card-select" ${developerMode?`data-preview-role="${roleKey}"`:`data-select-role="${roleKey}"`} ${isCurrent||(!developerMode&&reserved)||lockedVeteran?'disabled':''}><span>${buttonLabel}</span><i class="fas fa-${buttonIcon}"></i></button>
        </article>`;
    }).join('');
}

document.querySelectorAll('[data-role-billing]').forEach(button=>button.addEventListener('click',()=>{
    roleBillingCycle=button.dataset.roleBilling;
    document.querySelectorAll('[data-role-billing]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    if(selectedCheckoutRole)openRoleCheckout(selectedCheckoutRole);
    document.querySelectorAll('[data-role-billing]').forEach(item=>item.classList.toggle('active',item===button));
    renderRoleStore();
}));

function openRoleCheckout(role){
    const user=currentRoleUser();
    const plan=ROLE_STORE_PLANS[role];
    const sheet=document.getElementById('roleCheckoutSheet');
    if(!user||!plan||!sheet)return;
    clearTimeout(checkoutCloseTimer);
    selectedCheckoutRole=role;
    checkoutQuote={role,billing:roleBillingCycle,price:plan[roleBillingCycle],userId:user.id};
    const info=roleInfo(role);
    sheet.hidden=false;
    sheet.dataset.role=role.toLowerCase();
    const icon=document.getElementById('roleCheckoutIcon');if(icon){icon.innerHTML=`<i class="${info.icon}"></i>`;icon.style.background=info.grad;}
    const title=document.getElementById('roleCheckoutTitle');if(title)title.textContent=`Reserve ${info.label}`;
    const description=document.getElementById('roleCheckoutDescription');if(description)description.textContent=`Save ${info.label} on this device. You can change or remove this choice anytime. Your active role stays the same.`;
    const contact=document.getElementById('roleCheckoutContact');if(contact)contact.value=user.email||'';
    const cycle=document.getElementById('roleCheckoutCycle');if(cycle)cycle.textContent=roleBillingCycle==='yearly'?'Yearly plan · indicative launch price':'Monthly plan';
    const price=document.getElementById('roleCheckoutPrice');if(price)price.textContent=`$${plan[roleBillingCycle].toFixed(2)}`;
    requestAnimationFrame(()=>sheet.classList.add('open'));
    sheet.scrollIntoView({behavior:(liteOn()||REDUCED_MOTION)?'auto':'smooth',block:'nearest'});
}
function closeRoleCheckout(){
    const sheet=document.getElementById('roleCheckoutSheet');if(!sheet)return;
    sheet.classList.remove('open');selectedCheckoutRole=null;checkoutQuote=null;
    checkoutCloseTimer=setTimeout(()=>{sheet.hidden=true;},220);
}
document.getElementById('roleStoreGrid')?.addEventListener('click',event=>{
    const previewButton=event.target.closest('[data-preview-role]');
    const user=currentRoleUser();
    if(previewButton&&!previewButton.disabled&&user&&setDeveloperRolePreview(user,previewButton.dataset.previewRole)){
        renderNavbar();renderRoleStore();showToast(`Developer preview switched to ${roleInfo(previewButton.dataset.previewRole).label}.`,'eye');return;
    }
    const button=event.target.closest('[data-select-role]');
    if(button&&!button.disabled&&PREMIUM_ROLES.includes(button.dataset.selectRole))openRoleCheckout(button.dataset.selectRole);
});
document.getElementById('developerRoleLab')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-reset-role-preview]');const user=currentRoleUser();
    if(button&&!button.disabled&&user&&setDeveloperRolePreview(user,'DEV')){renderNavbar();renderRoleStore();showToast('Developer role preview restored.','code');}
});
document.getElementById('roleCheckoutClose')?.addEventListener('click',closeRoleCheckout);
document.getElementById('roleCheckoutSubmit')?.addEventListener('click',()=>{
    const user=currentRoleUser();const quote=checkoutQuote;
    if(!user||user.banned||!quote||quote.userId!==user.id)return;
    const order={id:`role_${crypto.randomUUID()}`,userId:user.id,role:quote.role,billing:quote.billing,quotedPrice:quote.price,currency:'USD',status:'reserved',createdAt:new Date().toISOString()};
    const orders=loadRoleOrders().filter(item=>item.userId!==user.id);orders.push(order);
    if(!saveRoleOrders(orders)){showToast('Storage is full. Your choice was not saved.','triangle-exclamation');return;}
    closeRoleCheckout();renderRoleStore();
    showToast(`${roleInfo(order.role).label} choice saved on this device.`,'check');
});

function showRegistrationWelcome(user){
    const overlay=document.getElementById('registrationWelcomeOverlay');
    const card=document.getElementById('registrationWelcomeCard');
    if(!overlay||!card||!user)return;
    const info=roleInfo(user.role);
    card.dataset.role=String(user.role||'USER').toLowerCase();
    const username=document.getElementById('welcomeUsername');if(username)username.textContent=user.displayName||user.username;
    const roleName=document.getElementById('welcomeRoleName');if(roleName)roleName.textContent=info.label;
    const reason=document.getElementById('welcomeRoleReason');if(reason)reason.textContent=user.role==='VETERAN'?'Unlocked forever for joining before May 2027':'Your starting Spectral identity';
    const lead=document.getElementById('welcomeLead');if(lead)lead.textContent=user.role==='VETERAN'?'Your identity is ready — and your arrival date unlocked a permanent reward.':'Your identity is ready. Welcome to the Spectral community.';
    const emblem=document.getElementById('welcomeRoleEmblem');if(emblem){emblem.innerHTML=`<span><i class="${info.icon}"></i></span>`;emblem.style.setProperty('--welcome-role',info.color);}
    const perks=document.getElementById('welcomePerks');if(perks)perks.innerHTML=info.perks.map(perk=>`<span><i class="fas fa-check"></i>${esc(perk)}</span>`).join('');
    overlay.classList.add('open');document.body.style.overflow='hidden';
    setTimeout(()=>document.getElementById('welcomeContinueBtn')?.focus(),450);
}
function closeRegistrationWelcome(){
    const overlay=document.getElementById('registrationWelcomeOverlay');if(!overlay)return;
    overlay.classList.remove('open');
    syncBodyScrollLock();
}
document.getElementById('registrationWelcomeClose')?.addEventListener('click',closeRegistrationWelcome);
document.getElementById('welcomeContinueBtn')?.addEventListener('click',closeRegistrationWelcome);
document.getElementById('welcomeExploreRolesBtn')?.addEventListener('click',()=>{closeRegistrationWelcome();setTimeout(openRoleStore,180);});
document.getElementById('registrationWelcomeOverlay')?.addEventListener('click',event=>{if(event.target===event.currentTarget)closeRegistrationWelcome();});

// ── Avatar upload ─────────────────────────────────────────────
const avatarUpload=document.getElementById('avatarUpload');
const AVATAR_FILE_TYPES=new Set(['image/png','image/jpeg','image/webp']);
function loadLocalImage(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('The selected file is not a valid image.'));image.src=url;});}
async function prepareAvatarFile(file){
    if(!file||!AVATAR_FILE_TYPES.has(file.type))throw new Error('Choose a PNG, JPEG or WebP image.');
    if(file.size>1024*1024)throw new Error('Avatar images must be 1 MB or smaller.');
    const objectUrl=URL.createObjectURL(file);
    try{
        const image=await loadLocalImage(objectUrl);
        if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth>4096||image.naturalHeight>4096)throw new Error('Avatar dimensions must be between 1 and 4096 pixels.');
        const size=256;
        const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
        const context=canvas.getContext('2d',{alpha:false});
        if(!context)throw new Error('This browser cannot process the image.');
        const scale=Math.max(size/image.naturalWidth,size/image.naturalHeight);
        const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
        context.drawImage(image,(size-width)/2,(size-height)/2,width,height);
        const dataUrl=canvas.toDataURL('image/webp',.86);
        if(dataUrl.length>350000||!safeAvatarUrl(dataUrl))throw new Error('The processed avatar is too large.');
        return dataUrl;
    }finally{URL.revokeObjectURL(objectUrl);}
}
if(avatarUpload){avatarUpload.addEventListener('change',async event=>{const ownerId=currentUserId;const file=event.target.files?.[0];if(!file||!ownerId)return;avatarUpload.disabled=true;try{const dataUrl=await prepareAvatarFile(file);if(currentUserId!==ownerId)return;const draft=profileDraftFor(currentRoleUser());draft.avatar=dataUrl;draft.removeAvatarRequested=false;updateProfileDraftState();const image=document.getElementById('profileAvatarImg');if(image)image.src=dataUrl;document.getElementById('profileEditForm')?.requestSubmit();}catch(error){showToast(error.message||'Avatar could not be processed.','triangle-exclamation');}finally{avatarUpload.disabled=false;avatarUpload.value='';}});}

// ── Logout ────────────────────────────────────────────────────
const logoutBtn=document.getElementById('logoutBtn');
if(logoutBtn)logoutBtn.addEventListener('click',signOutAccount);

// ── Launcher info tab ─────────────────────────────────────────
const goAccBtn=document.getElementById('goToAccountsBtn');
if(goAccBtn){goAccBtn.addEventListener('click',()=>{closeDashboard();document.querySelector('[data-target="accounts"]').click();});}
// Drafts are kept in memory, scoped to the signed-in account, until saved/discarded.
const profileDrafts=new Map();
const PROFILE_FIELDS=['displayName','status','bio','avatar'];
let profileSaving=false;
let compareCategory='capacity';
function profileDraftFor(user){
    if(!profileDrafts.has(user.id))profileDrafts.set(user.id,{displayName:user.displayName||user.username,status:user.status||'',bio:user.bio||'',avatar:user.avatar||'',removeAvatarRequested:false});
    return profileDrafts.get(user.id);
}
function profileIsDirty(user){return !!user&&(profileDraftFor(user).removeAvatarRequested||PROFILE_FIELDS.some(key=>profileDraftFor(user)[key]!==String(user[key]||(key==='displayName'?user.username:''))));}
function updateProfileDraftState(){
    const user=currentRoleUser();if(!user)return;
    const dirty=profileIsDirty(user);
    for(const id of ['profileDisplayName','profileStatus','profileBio']){
        const input=document.getElementById(id),count=document.getElementById(id+'Count');
        if(input&&count)count.textContent=`${input.value.length} / ${input.maxLength}`;
    }
    document.getElementById('saveProfileBtn').disabled=!dirty||profileSaving;
    document.getElementById('resetProfileBtn').disabled=!dirty||profileSaving;
    const state=document.getElementById('profileSaveState');
    state.textContent=profileSaving?'Saving your profile…':dirty?'Unsaved changes · kept while switching tabs':user.pendingAvatar?'Avatar awaiting review':'All changes saved';
    state.classList.toggle('is-dirty',dirty);
    renderAccountStudio();
}
for(const [id,key] of [['profileDisplayName','displayName'],['profileStatus','status'],['profileBio','bio']]){
    document.getElementById(id)?.addEventListener('input',event=>{const user=currentRoleUser();if(!user)return;profileDraftFor(user)[key]=event.target.value;updateProfileDraftState();});
}
document.getElementById('resetProfileBtn')?.addEventListener('click',()=>{const user=currentRoleUser();if(!user)return;profileDrafts.delete(user.id);loadProfileViewData(user,{resetTab:false});});
document.getElementById('changeAvatarBtn')?.addEventListener('click',()=>document.getElementById('avatarUpload').click());
document.getElementById('removeAvatarBtn')?.addEventListener('click',()=>{const user=currentRoleUser();if(!user)return;const draft=profileDraftFor(user);draft.avatar='';draft.removeAvatarRequested=true;document.getElementById('profileAvatarImg').src=siteAvatarUrl({...user,avatar:''});updateProfileDraftState();document.getElementById('profileEditForm')?.requestSubmit();});
document.getElementById('profileEditForm')?.addEventListener('submit',async event=>{
    event.preventDefault();const user=currentRoleUser();if(!user||user.banned||profileSaving)return;
    const draft={...profileDraftFor(user)};
    const patch={displayName:sanitizeField(draft.displayName,24),status:sanitizeField(draft.status,100),bio:sanitizeField(draft.bio,120),avatar:safeAvatarUrl(draft.avatar)};
    if(!patch.displayName){document.getElementById('profileDisplayName').focus();showToast('Enter a display name.','circle-info');return;}
    const nameIssue=AccountPolicy.nameIssue(patch.displayName);if(nameIssue){showToast(nameIssue,'circle-info');return;}
    const avatarChanged=patch.avatar!==user.avatar||draft.removeAvatarRequested;
    let pendingAvatar=avatarChanged&&patch.avatar?patch.avatar:avatarChanged?'':user.pendingAvatar||'';
    let avatarDecision='pending';
    profileSaving=true;updateProfileDraftState();
    try{
        if(validSupabaseConfig()){
            if(!cloudReady()||cloudAuthUserId!==user.id)throw new Error('Reconnect to save your profile. Your draft is still here.');
            if(avatarChanged){
                const queue=patch.avatar
                    ? await cloud.from('spectral_avatar_queue').upsert({user_id:user.id,avatar:patch.avatar},{onConflict:'user_id'})
                    : await cloud.from('spectral_avatar_queue').delete().eq('user_id',user.id);
                if(queue.error)throw new Error('Avatar review queue is unavailable. Apply the moderation migration.');
            }
            const changes={display_name:patch.displayName,status:patch.status,bio:patch.bio};
            if(avatarChanged&&!patch.avatar)changes.avatar='';
            const {error,data}=await cloud.from('site_users').update(changes).eq('id',user.id).select('id,avatar');
            if(error||!data?.some(row=>row.id===user.id))throw new Error('Profile could not be saved online. Please try again.');
            if(avatarChanged&&patch.avatar){
                try{
                    const review=await cloud.functions.invoke('moderate-content',{body:{kind:'avatar'}});
                    if(!review.error&&['approved','rejected'].includes(review.data?.decision)){
                        avatarDecision=review.data.decision;
                        pendingAvatar='';
                    }
                }catch(error){console.warn('[avatar] automatic review unavailable:',error.message||error);}
            }
        }
        if(currentUserId!==user.id)return;
        const next=siteUsers.map(item=>item.id===user.id?{...item,...patch,avatar:avatarChanged&&patch.avatar?(avatarDecision==='approved'?patch.avatar:item.avatar):patch.avatar,pendingAvatar}:item);
        if(validSupabaseConfig()){
            try{localStorage.setItem(K_USERS,JSON.stringify(cacheableSiteUsers(next)));}catch{}
        }else{
            const changes=[];
            if(user.displayName!==patch.displayName)changes.push({id:user.id,username:user.username,before:user.displayName,after:patch.displayName});
            if(user.bio!==patch.bio)changes.push({id:user.id,username:user.username,before:'Bio',after:'Updated'});
            if(user.status!==patch.status)changes.push({id:user.id,username:user.username,before:'Status',after:'Updated'});
            if(avatarChanged)changes.push({id:user.id,username:user.username,before:user.pendingAvatar?'Pending avatar':user.avatar?'Visible avatar':'No avatar',after:pendingAvatar?'Pending review':patch.avatar?'Visible avatar':'No avatar'});
            const audit=readJsonStorage(K_ADMIN_AUDIT,[],Array.isArray);
            if(changes.length)audit.push({id:crypto.randomUUID(),actorId:user.id,actorName:user.username,action:'profile',reason:'Account owner edited profile',createdAt:new Date().toISOString(),changes});
            persistAdminRecords(new Map([[K_USERS,next],[K_ADMIN_AUDIT,audit.slice(-200)]]));
        }
        siteUsers=next;
        // Edits entered while the request ran remain a draft.
        if(PROFILE_FIELDS.every(key=>profileDraftFor(user)[key]===draft[key])&&profileDraftFor(user).removeAvatarRequested===draft.removeAvatarRequested)profileDrafts.delete(user.id);
        renderNavbar();renderFriends();loadProfileViewData(currentRoleUser(),{resetTab:false});
        const message=avatarChanged&&patch.avatar
            ? avatarDecision==='approved'?'Avatar approved automatically.':avatarDecision==='rejected'?'Avatar was rejected by automatic review.': 'Avatar is waiting for review. Your current avatar stays visible.'
            :'Profile saved.';
        showToast(message,avatarDecision==='rejected'?'triangle-exclamation':'check');
    }catch(error){showToast(error.message,'triangle-exclamation');document.getElementById('profileSaveState').textContent=error.message;}
    finally{profileSaving=false;updateProfileDraftState();}
});
function renderAccountSession(user){
    const online=validSupabaseConfig();
    document.getElementById('accountSessionDetails').innerHTML=`<div class="account-session-summary"><span class="session-orb"><i class="fas fa-${online?'shield-halved':'laptop'}"></i></span><div><strong>${online?'Connected account':'Local demo account'}</strong><p>${online?'Your profile uses authenticated cloud access.':'This identity exists in this browser. It is separate from a Minecraft or Microsoft account.'}</p></div><span class="session-state">${online?'Authenticated':'This device'}</span></div><dl class="account-detail-grid"><div><dt><i class="fas fa-at"></i> Sign-in name</dt><dd>${esc(user.username)}</dd></div><div><dt><i class="fas fa-id-badge"></i> Actual role</dt><dd>${esc(roleInfo(user.role).label)}</dd></div><div><dt><i class="fas fa-calendar-check"></i> Joined</dt><dd>${esc(user.registeredAt||'Unknown')}</dd></div><div><dt><i class="fas fa-lock"></i> Password recovery</dt><dd>${online?'Email reset link':'Unavailable for local demos'}</dd></div></dl>`;
    document.getElementById('accountRecoveryBtn').hidden=!online||!user.email;
}
document.getElementById('exportOwnAccount')?.addEventListener('click',()=>{
    const user=currentRoleUser();if(!user)return;
    downloadJson('spectral-my-account.json',{exportedAt:new Date().toISOString(),profile:safeUserExport(user),appearance:loadProfileStyles()[user.id]||{},launchChoice:loadRoleOrders().find(order=>order.userId===user.id)||null});
    showToast('Your account export is ready.','download');
});
document.getElementById('accountRecoveryBtn')?.addEventListener('click',async event=>{
    const user=currentRoleUser(),button=event.currentTarget;if(!authAvailable()||!user?.email)return;button.disabled=true;
    try{const {error}=await cloud.auth.resetPasswordForEmail(user.email,{redirectTo:authRedirectTo()});if(error)throw error;showToast('Check your inbox for a password reset link.','envelope');}catch{showToast('Reset email could not be sent. Try again.','triangle-exclamation');}finally{button.disabled=false;}
});
function renderRoleWorkspace(user){
    const role=roleInfo(user.role),accounts=loadMcAccounts(user.id)||[];
    document.getElementById('accountEntitlements').innerHTML=[['cubes','Launcher profiles',accounts.length,role.profileLimit],['star','Favorite profiles',accounts.filter(account=>account.favorite).length,role.favoriteLimit]].map(([icon,label,count,limit])=>`<article><span><i class="fas fa-${icon}"></i>${label}</span><b>${count} <small>/ ${formatRoleLimit(limit)}</small></b><div class="entitlement-track"><i style="width:${Number.isFinite(limit)?Math.min(100,count/limit*100):Math.min(100,count*5)}%"></i></div><small>${count>limit?'Above your current limit · remove profiles before adding more':`Included with your ${esc(role.label)} role`}</small></article>`).join('')+`<article><span><i class="fas fa-shield-halved"></i> Account permissions</span><b>${canAccessAdmin(user)?'Staff':'Player'}</b><small>${canManageUsers(user)?'Manage lower roles and community access':canModerate(user)?'Review community ideas':'Personal profile, friends and launcher identities'}</small></article>`;
    const reservation=loadRoleOrders().find(order=>order.userId===user.id),panel=document.getElementById('roleReservation');panel.hidden=!reservation;
    if(reservation)panel.innerHTML=`<span><i class="fas fa-bookmark"></i></span><div><small>SAVED ON THIS DEVICE</small><strong>${esc(roleInfo(reservation.role).label)} · ${reservation.billing}</strong><p>$${reservation.quotedPrice.toFixed(2)} indicative price · no active subscription</p></div><button type="button" data-cancel-reservation><i class="fas fa-xmark"></i> Remove choice</button>`;
    renderRoleComparison();
}
document.getElementById('roleReservation')?.addEventListener('click',event=>{if(!event.target.closest('[data-cancel-reservation]'))return;const user=currentRoleUser();if(!user)return;if(saveRoleOrders(loadRoleOrders().filter(order=>order.userId!==user.id))){renderRoleStore();showToast('Launch choice removed.','check');}else showToast('Could not remove your choice. Try again.','triangle-exclamation');});
function renderRoleComparison(){
    const user=currentRoleUser();if(!user)return;
    const keys=compareCategory==='permissions'?['USER','PRO','SPECTRAL','MODERATOR','ADMIN','DEV']:['USER','VETERAN','PRO','LEGEND','SPECTRAL'];
    const rows=compareCategory==='capacity'?[['Launcher profiles',key=>formatRoleLimit(roleProfileLimit(key))],['Favorite profiles',key=>formatRoleLimit(roleFavoriteLimit(key))],['Role source',key=>key==='VETERAN'?'Founder reward':PREMIUM_ROLES.includes(key)?'Planned premium':'Default']]:compareCategory==='appearance'?[['Signature header',key=>PROFILE_HEADERS[ROLE_DEFAULT_HEADERS[key]]?.label||'Included'],['Entrance',key=>PROFILE_ENTRANCES[ROLE_DEFAULT_ENTRANCES[key]]?.label||'Included'],['Community badge',key=>key==='USER'?'Standard identity':roleInfo(key).label]]:[['Manage own profile',()=>true],['Review ideas',key=>roleRank(key)>=10],['Manage lower roles',key=>roleRank(key)>=20],['Developer previews',key=>key==='DEV']];
    document.getElementById('roleComparisonGrid').innerHTML=`<table><thead><tr><th scope="col">${compareCategory==='permissions'?'Access':'Feature'}</th>${keys.map(key=>`<th scope="col" class="${key===user.role?'is-current':''}"><i class="${roleInfo(key).icon}"></i> ${esc(roleInfo(key).label)}${key===user.role?'<small>Your role</small>':''}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,read])=>`<tr><th scope="row">${label}</th>${keys.map(key=>{const value=read(key);return `<td>${typeof value==='boolean'?`<span class="permission-${value}"><i class="fas fa-${value?'check':'minus'}"></i><span class="sr-only">${value?'Included':'Not included'}</span></span>`:esc(value)}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
}
document.querySelectorAll('[data-compare]').forEach(button=>button.addEventListener('click',()=>{compareCategory=button.dataset.compare;document.querySelectorAll('[data-compare]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));renderRoleComparison();}));
// ── Admin Panel ───────────────────────────────────────────────
let adminActiveTab='users';
let adminPage=1;
const ADMIN_PAGE_SIZE=12;
let adminCloudConnected=false;
let adminCloudError='';
let adminCloudIds=new Set();
let adminRemoteAudit=[];
let adminForumFilter='all';
let adminInspectedUserId=null;
const adminSelectedUserIds=new Set();
let adminPendingAction=null;
let adminActionBusy=false;
const K_ADMIN_AUDIT='spectral_admin_audit';

function adminAuditEntries(){return validSupabaseConfig()?adminRemoteAudit:readJsonStorage(K_ADMIN_AUDIT,[],Array.isArray).filter(entry=>entry&&typeof entry==='object').slice(-200);}
function renderAdminAudit(){
    const list=document.getElementById('adminAuditList');if(!list||!canAccessAdmin(currentRoleUser()))return;
    const entries=adminAuditEntries().slice().reverse();
    list.innerHTML=entries.length?entries.map(entry=>`<article><span><i class="fas fa-${entry.action==='role'?'id-badge':entry.action==='ban'?'ban':entry.action==='delete'?'trash-can':'unlock'}"></i></span><div><header><strong>${esc(entry.actorName||entry.actorId||'Staff')} · ${esc(entry.action)}</strong><time>${esc(new Date(entry.createdAt).toLocaleString())}</time></header><p>${esc(entry.reason||'No reason recorded')}</p><small>${(Array.isArray(entry.changes)?entry.changes:[]).map(change=>`${esc(change.username||change.id)}: ${esc(change.before)} → ${esc(change.after)}`).join(' · ')}</small></div></article>`).join(''):'<div class="admin-empty-state"><i class="fas fa-clock-rotate-left"></i><h3>A clear starting point</h3><p>Reviewed account changes will appear here with their reason.</p></div>';
}
function cancelAdminAction(){adminPendingAction=null;const panel=document.getElementById('adminActionReview');if(panel)panel.hidden=true;}
function reviewAdminAction(action,ids,role=null){
    const actor=currentRoleUser();
    const targets=[...new Set(ids)].map(id=>siteUsers.find(user=>user.id===id));
    if(!['role','ban','unban','delete'].includes(action)||!targets.length)return showToast('Choose an account and an action first.','circle-info');
    if(targets.some(target=>!canAdminManageTarget(actor,target)||!AccountPolicy.canManage(actor,target,action==='role'?role:null))||(action==='delete'&&(!isDev(actor)||validSupabaseConfig())))return showToast('Your account cannot make this change.','lock');
    adminPendingAction={actorId:actor.id,action,role,targets:targets.map(user=>({id:user.id,username:user.username,role:user.role,banned:user.banned}))};
    const panel=document.getElementById('adminActionReview');panel.hidden=false;
    document.getElementById('adminReviewTitle').textContent=`${action==='role'?'Change role':action==='delete'?'Delete local account':action==='ban'?'Restrict sign-in':'Restore sign-in'} · ${targets.length} account${targets.length===1?'':'s'}`;
    document.getElementById('adminReviewDiff').innerHTML=targets.map(user=>`<div class="admin-change-row"><strong>${esc(user.displayName||user.username)}</strong><span>${esc(action==='role'?roleInfo(user.role).label:user.banned?'Restricted':'Active')}</span><i class="fas fa-arrow-right"></i><b>${esc(action==='role'?roleInfo(role).label:action==='delete'?'Deleted with local data':action==='ban'?'Restricted':'Active')}</b></div>`).join('');
    document.getElementById('adminActionReason').value='';document.getElementById('adminActionError').textContent='';
    panel.scrollIntoView({behavior:REDUCED_MOTION||liteOn()?'auto':'smooth',block:'nearest'});document.getElementById('adminActionReason').focus({preventScroll:true});
}
// Roll back this bounded set of local records if storage rejects a write.
function persistAdminRecords(records){
    const previous=new Map([...records.keys()].map(key=>[key,localStorage.getItem(key)]));
    try{for(const [key,value] of records)value===null?localStorage.removeItem(key):localStorage.setItem(key,JSON.stringify(value));}
    catch(error){for(const [key,value] of previous){try{value===null?localStorage.removeItem(key):localStorage.setItem(key,value);}catch{}}throw error;}
}
async function applyReviewedAdminAction(){
    if(adminActionBusy||!adminPendingAction)return;
    const proposal=adminPendingAction,reason=sanitizeField(document.getElementById('adminActionReason').value,160);
    if(reason.length<3){document.getElementById('adminActionError').textContent='Add a short reason (at least 3 characters).';document.getElementById('adminActionReason').focus();return;}
    const button=document.getElementById('adminConfirmAction');adminActionBusy=true;button.disabled=true;
    try{
        const fresh=validSupabaseConfig()?siteUsers:loadSiteUsers();
        const actor=fresh?.find(user=>user.id===currentUserId);
        if(!actor||actor.id!==proposal.actorId)throw new Error('Your session changed. Review this action again.');
        const targets=proposal.targets.map(before=>{
            const target=fresh.find(user=>user.id===before.id);
            if(!AccountPolicy.canManage(actor,target,proposal.action==='role'?proposal.role:null)||(proposal.action==='delete'&&!isDev(actor)))throw new Error('Permissions changed. Review the account again.');
            if(target.role!==before.role||target.banned!==before.banned)throw new Error('An account changed after your review. Cancel and review the latest state.');
            return target;
        });
        if(validSupabaseConfig()){
            if(!adminCloudConnected||cloudAuthUserId!==actor.id)throw new Error('Reconnect to administration before applying changes.');
            const {error}=await cloud.rpc('spectral_admin_apply',{p_targets:proposal.targets,p_action:proposal.action,p_role:proposal.role,p_reason:reason});
            if(error)throw new Error('Server rejected the change. Refresh the directory and review your permissions.');
            if(currentUserId!==actor.id)return;
            await loadAdminCloud();
        }else{
            const ids=new Set(targets.map(user=>user.id));
            const next=fresh.filter(user=>proposal.action!=='delete'||!ids.has(user.id)).map(user=>!ids.has(user.id)?user:proposal.action==='role'?{...user,role:proposal.role,roleSource:'admin'}:{...user,banned:proposal.action==='ban'});
            const entry={id:crypto.randomUUID(),createdAt:new Date().toISOString(),actorId:actor.id,actorName:actor.username,action:proposal.action,reason,changes:targets.map(user=>({id:user.id,username:user.username,before:proposal.action==='role'?user.role:user.banned?'Restricted':'Active',after:proposal.action==='role'?proposal.role:proposal.action==='delete'?'Deleted':proposal.action==='ban'?'Restricted':'Active'}))};
            const records=new Map([[K_USERS,next],[K_ADMIN_AUDIT,[...adminAuditEntries(),entry].slice(-200)]]);
            if(proposal.action==='delete'){
                const styles=loadProfileStyles(),previews=loadDevRolePreviews();
                for(const id of ids){records.set(K_MC_PFX+id,null);records.set(K_MC_ACT+id,null);delete styles[id];delete previews[id];}
                records.set(K_PROFILE_STYLES,styles);records.set(K_DEV_ROLE_PREVIEWS,previews);
                records.set(K_ROLE_ORDERS,loadRoleOrders().filter(order=>!ids.has(order.userId)));
                records.set(K_FRIENDS,friendships.filter(item=>!ids.has(item.requester)&&!ids.has(item.addressee)));
                records.set(K_FORUM,forumPosts.filter(post=>!ids.has(post.authorId)).map(post=>({...post,upvotes:(post.upvotes||[]).filter(id=>!ids.has(id))})));
            }
            persistAdminRecords(records);siteUsers=next;
            if(proposal.action==='delete'){friendships=records.get(K_FRIENDS);forumPosts=records.get(K_FORUM);}
        }
        if(currentUserId!==proposal.actorId)return;
        cancelAdminAction();adminSelectedUserIds.clear();refreshAdmin();renderAdminAudit();renderAll();showToast('Reviewed changes saved.','check');
    }catch(error){document.getElementById('adminActionError').textContent=error.message||'Could not save the change. Try again.';}
    finally{adminActionBusy=false;button.disabled=false;}
}
async function loadAdminCloud(){
    const actor=currentRoleUser();if(!canAccessAdmin(actor)||!authAvailable())return;
    adminCloudConnected=false;
    adminCloudError='';
    try{
        const {data,error}=await cloud.rpc('spectral_admin_snapshot');
        if(error||!data)throw new Error('Server administration is unavailable. Install the administration migration to enable roles, bans and activity history.');
        if(currentUserId!==actor.id)return;
        const profiles=(data.users||[]).map(row=>cloudProfileToUser(row)).filter(Boolean);
        adminCloudIds=new Set(profiles.map(user=>user.id));
        profiles.forEach(user=>{const index=siteUsers.findIndex(item=>item.id===user.id);if(index<0)siteUsers.push(user);else siteUsers[index]={...siteUsers[index],...user};});
        adminRemoteAudit=Array.isArray(data.audit)?data.audit:[];adminCloudConnected=true;adminCloudError='';
        refreshAdmin();renderAdminAudit();
    }catch(error){adminCloudIds.clear();adminCloudError=error.message;const legacy=document.getElementById('adminUsersList');if(legacy){legacy.innerHTML=`<div class="admin-empty-state"><i class="fas fa-plug-circle-exclamation"></i><h3>Administration needs a connection</h3><p>${esc(error.message)}</p><button type="button" id="retryAdminConnection">Retry</button></div>`;document.getElementById('retryAdminConnection')?.addEventListener('click',loadAdminCloud);}refreshAdmin();}
}
function renderAdminPagination(total){
    const pages=Math.max(1,Math.ceil(total/ADMIN_PAGE_SIZE));
    document.getElementById('adminPagination').innerHTML=`<span>${total} results · Page ${adminPage} of ${pages}</span><div><button type="button" data-admin-page="-1" ${adminPage===1?'disabled':''} aria-label="Previous page"><i class="fas fa-arrow-left"></i></button><button type="button" data-admin-page="1" ${adminPage===pages?'disabled':''} aria-label="Next page"><i class="fas fa-arrow-right"></i></button></div>`;
}
document.getElementById('adminPagination')?.addEventListener('click',event=>{const button=event.target.closest('[data-admin-page]');if(!button||button.disabled)return;adminPage+=Number(button.dataset.adminPage);adminSelectedUserIds.clear();renderAdminUsers();});
document.getElementById('adminCancelAction')?.addEventListener('click',cancelAdminAction);
document.getElementById('adminConfirmAction')?.addEventListener('click',applyReviewedAdminAction);
document.getElementById('adminSubtabs')?.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const tabs=[...event.currentTarget.querySelectorAll('[data-stab]')],index=tabs.indexOf(document.activeElement);if(index<0)return;
    event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();openAdminSection(tabs[next].dataset.stab);
});

function openAdminSection(target){
    if(!canAccessAdmin(currentRoleUser())||!['users','forum','activity','site-stats'].includes(target))return;
    adminActiveTab=target;
    document.querySelectorAll('.admin-stab').forEach(tab=>{
        const active=tab.getAttribute('data-stab')===target;
        tab.classList.toggle('active',active);
        tab.setAttribute('aria-selected',String(active));
        tab.setAttribute('role','tab');tab.tabIndex=active?0:-1;
        tab.id='adminTab-'+tab.dataset.stab;tab.setAttribute('aria-controls','adminSection-'+tab.dataset.stab);
    });
    document.querySelectorAll('.admin-stab-content').forEach(content=>{
        content.hidden=content.dataset.stabContent!==target;content.style.display=content.hidden?'none':'block';
        content.id='adminSection-'+content.dataset.stabContent;content.setAttribute('role','tabpanel');content.setAttribute('aria-labelledby','adminTab-'+content.dataset.stabContent);
    });
    if(target==='users')renderAdminUsers();
    if(target==='forum')renderAdminForum();
    if(target==='site-stats')renderAdminStats();
    if(target==='activity')renderAdminAudit();
}
document.querySelectorAll('.admin-stab').forEach(stab=>stab.addEventListener('click',()=>openAdminSection(stab.getAttribute('data-stab'))));

const adminSearchInput=document.getElementById('adminUserSearch');
const adminRoleFilter=document.getElementById('adminRoleFilter');
const adminStatusFilter=document.getElementById('adminStatusFilter');
const adminUserSort=document.getElementById('adminUserSort');
[adminSearchInput,adminRoleFilter,adminStatusFilter,adminUserSort].forEach(control=>{
    if(control)control.addEventListener(control.tagName==='INPUT'?'input':'change',()=>{adminPage=1;adminSelectedUserIds.clear();renderAdminUsers();});
});
const adminResetUserFilters=document.getElementById('adminResetUserFilters');
if(adminResetUserFilters)adminResetUserFilters.addEventListener('click',()=>{
    if(adminSearchInput)adminSearchInput.value='';
    if(adminRoleFilter)adminRoleFilter.value='';
    if(adminStatusFilter)adminStatusFilter.value='';
    if(adminUserSort)adminUserSort.value='role';
    window.SpectralControls?.refresh();
    adminPage=1;adminSelectedUserIds.clear();renderAdminUsers();
});
const adminForumSearch=document.getElementById('adminForumSearch');
if(adminForumSearch)adminForumSearch.addEventListener('input',renderAdminForum);
document.querySelectorAll('[data-admin-forum-filter]').forEach(button=>button.addEventListener('click',()=>{
    adminForumFilter=button.dataset.adminForumFilter||'all';
    document.querySelectorAll('[data-admin-forum-filter]').forEach(item=>item.classList.toggle('active',item===button));
    renderAdminForum();
}));
const adminAnalyticsRefresh=document.getElementById('adminAnalyticsRefresh');
if(adminAnalyticsRefresh)adminAnalyticsRefresh.addEventListener('click',()=>{
    adminAnalyticsRefresh.classList.add('is-loading');
    renderAdminStats();
    setTimeout(()=>adminAnalyticsRefresh.classList.remove('is-loading'),450);
});
document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'&&adminActiveTab==='users'&&document.getElementById('profilePanelAdmin')?.hidden===false&&canAccessAdmin(currentRoleUser())&&dashOverlay?.classList.contains('open')){
        event.preventDefault();
        adminSearchInput?.focus();
    }
});

// ── Admin helpers ─────────────────────────────────────────────
function formatDuration(sec){
    sec=Math.round(sec||0);
    if(sec<60)return sec+'s';
    const m=Math.floor(sec/60); if(m<60)return m+'m';
    const h=Math.floor(m/60), mm=m%60; if(h<24)return mm?`${h}h ${mm}m`:`${h}h`;
    const d=Math.floor(h/24); return `${d}d ${h%24}h`;
}
function timeAgo(iso){
    if(!iso)return 'never';
    const t=new Date(iso).getTime(); if(isNaN(t))return 'never';
    const m=Math.floor((Date.now()-t)/60000);
    if(m<1)return 'just now'; if(m<60)return m+'m ago';
    const h=Math.floor(m/60); if(h<24)return h+'h ago';
    const d=Math.floor(h/24); if(d<30)return d+'d ago';
    return Math.floor(d/30)+'mo ago';
}
function parseRegDate(s){
    if(!s)return 0;
    const m=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
    if(m)return new Date(+m[3],+m[2]-1,+m[1]).getTime();
    const t=new Date(s).getTime(); return isNaN(t)?0:t;
}
function registeredWithinDays(s,days){return AccountPolicy.recent(parseRegDate(s),days*86400000);}
function isRecentlyActive(iso,days){return AccountPolicy.recent(iso,days*86400000);}
function isOnlineNow(iso){return AccountPolicy.recent(iso,15*60000);}
function canAdminManageTarget(viewer,target){return (!validSupabaseConfig()||adminCloudConnected)&&AccountPolicy.canManage(viewer,target);}
function adminAllowedRoles(viewer){return ROLE_ORDER.filter(role=>viewer&&!viewer.banned&&roleRank(viewer.role)>=20&&(isDev(viewer)||roleRank(role)<roleRank(viewer.role)));}
function safeMcAccountExport(account){
    const copy={...account};delete copy.password;delete copy.accessToken;delete copy.refreshToken;
    return copy;
}
function safeUserExport(user){
    const copy={...user};delete copy.password;
    return {...copy,minecraftProfiles:(loadMcAccounts(user.id)||[]).map(safeMcAccountExport)};
}
function downloadJson(filename,data){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download=filename;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function exportDatabase(){
    const data={ exportedAt:new Date().toISOString(), users:siteUsers.map(u=>{const c={...u};delete c.password;return c;}), mcAccounts:{}, forum:forumPosts, news:newsItems };
    siteUsers.forEach(u=>{ data.mcAccounts[u.id]=(loadMcAccounts(u.id)||[]).map(safeMcAccountExport); });
    downloadJson('spectral-db-'+new Date().toISOString().slice(0,10)+'.json',data);
}
function exportAdminUsers(users,label='users'){
    if(!users.length){showToast('Select at least one user','circle-info');return;}
    downloadJson(`spectral-${label}-${new Date().toISOString().slice(0,10)}.json`,{exportedAt:new Date().toISOString(),users:users.map(safeUserExport)});
    showToast(`${users.length} user${users.length===1?'':'s'} exported`,'file-export');
}
function refreshAdmin(){
    updateAdminOverview();
    renderAdminUsers();
    if(adminActiveTab==='forum')renderAdminForum();
    if(adminActiveTab==='site-stats')renderAdminStats();
}

function renderAdminPanel() {
    if(!canAccessAdmin(currentRoleUser()))return;
    adminSelectedUserIds.clear();
    updateAdminOverview();
    populateAdminBulkRoles();
    openAdminSection(adminActiveTab);
    if(validSupabaseConfig())loadAdminCloud();
}
function updateAdminOverview(){
    const viewer=siteUsers.find(user=>user.id===currentUserId);
    const pending=forumPosts.filter(post=>!post.approved&&!post.rejected).length;
    const values={adminOverviewUsers:adminDataset().length,adminOverviewActive:adminDataset().filter(user=>isRecentlyActive(user.lastSeen,7)).length,adminOverviewPending:pending,adminOverviewBanned:adminDataset().filter(user=>user.banned).length,adminUsersTabCount:adminDataset().length,adminForumTabCount:pending};
    Object.entries(values).forEach(([id,value])=>{const element=document.getElementById(id);if(element)element.textContent=String(value);});
    const access=document.getElementById('adminAccessBadge');
    if(access&&viewer){const info=roleInfo(viewer.role);access.innerHTML=`<i class="${info.icon}"></i> ${esc(info.label)} access`;}
    const note=document.getElementById('adminModeNote');if(note)note.textContent=validSupabaseConfig()?'Cloud accounts: roles and bans are checked and applied by the server. The directory shows up to 250 profiles.':'Local demo: changes affect accounts in this browser. Role checks here do not secure a remote service.';
    const cloudState=document.getElementById('adminCloudState');
    if(cloudState){cloudState.classList.toggle('is-cloud',Boolean(cloudAuthUserId));cloudState.innerHTML=validSupabaseConfig()?(adminCloudConnected?'<i></i> Server verified':'<i></i> Connecting to administration'):'<i></i> Local demo data';}
}
function populateAdminBulkRoles(){
    const select=document.getElementById('adminBulkRole');if(!select)return;
    const viewer=siteUsers.find(user=>user.id===currentUserId);
    select.innerHTML='<option value="">Choose role...</option>'+adminAllowedRoles(viewer).map(role=>`<option value="${role}">${ROLES[role].label}</option>`).join('');
}
function adminDataset(){return validSupabaseConfig()?siteUsers.filter(user=>adminCloudIds.has(user.id)):siteUsers;}
function getAdminFilteredUsers(){
    const search=(adminSearchInput?.value||'').trim().toLowerCase();
    const role=adminRoleFilter?.value||'';
    const status=adminStatusFilter?.value||'';
    const sort=adminUserSort?.value||'role';
    const users=adminDataset().filter(user=>{
        const haystack=[user.username,user.displayName,user.bio,user.email].join(' ').toLowerCase();
        if(search&&!haystack.includes(search))return false;
        if(role&&user.role!==role)return false;
        if(status==='online'&&!isOnlineNow(user.lastSeen))return false;
        if(status==='active'&&!isRecentlyActive(user.lastSeen,7))return false;
        if(status==='banned'&&!user.banned)return false;
        if(status==='inactive'&&isRecentlyActive(user.lastSeen,30))return false;
        return true;
    });
    const sorts={
        role:(a,b)=>roleRank(b.role)-roleRank(a.role)||(a.username||'').localeCompare(b.username||''),
        recent:(a,b)=>(new Date(b.lastSeen||0).getTime()||0)-(new Date(a.lastSeen||0).getTime()||0),
        joined:(a,b)=>parseRegDate(b.registeredAt)-parseRegDate(a.registeredAt),
        time:(a,b)=>(b.totalTimeSec||0)-(a.totalTimeSec||0),
        name:(a,b)=>(a.displayName||a.username||'').localeCompare(b.displayName||b.username||'')
    };
    return users.sort(sorts[sort]||sorts.role);
}
function selectedAdminUsers(){
    const viewer=siteUsers.find(user=>user.id===currentUserId);
    const selected=siteUsers.filter(user=>adminSelectedUserIds.has(user.id)&&canAdminManageTarget(viewer,user));
    const valid=new Set(selected.map(user=>user.id));
    [...adminSelectedUserIds].forEach(id=>{if(!valid.has(id))adminSelectedUserIds.delete(id);});
    return selected;
}
function updateAdminBulkBar(){
    const selected=selectedAdminUsers();
    const bar=document.getElementById('adminBulkBar');
    const count=document.getElementById('adminSelectedCount');
    if(bar)bar.hidden=selected.length===0;
    if(count)count.textContent=`${selected.length} selected`;
}
function renderAdminUserInspector(user){
    const panel=document.getElementById('adminUserInspector');if(!panel)return;
    if(!user){panel.innerHTML='<div class="admin-inspector-empty"><span><i class="fas fa-user-gear"></i></span><h3>Select a user</h3><p>Open any account to inspect its activity, identities and access level.</p></div>';return;}
    const profiles=loadMcAccounts(user.id)||[];
    const info=roleInfo(user.role);
    const profileRows=profiles.slice(0,4).map(account=>`<div class="admin-inspector-profile"><span><i class="${typeIcon(account.type)}"></i></span><div><b>${esc(account.username||'Unnamed')}</b><small>${esc(typeLabel(account.type))}</small></div></div>`).join('');
    panel.innerHTML=`
        <div class="admin-inspector-top"><span>Account details</span><button type="button" data-inspector-close aria-label="Close details"><i class="fas fa-times"></i></button></div>
        <div class="admin-inspector-identity"><div class="admin-inspector-avatar"><img src="${esc(siteAvatarUrl(user))}" width="100" height="100" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback alt=""><i class="${isOnlineNow(user.lastSeen)?'online':''}"></i></div><div><small>@${esc(user.username)}</small><h3>${esc(user.displayName||user.username)}</h3>${roleBadgeHtml(user.role)||'<span class="role-badge role-user"><i class="fas fa-user"></i> Player</span>'}</div></div>
        <p class="admin-inspector-bio">${esc(user.bio||'No biography has been added yet.')}</p>
        <div class="admin-inspector-access"><span style="--role-color:${info.color}"><i class="${info.icon}"></i></span><div><small>Access level</small><b>${esc(info.label)}</b></div><em>${user.banned?'Banned':isOnlineNow(user.lastSeen)?'Online':timeAgo(user.lastSeen)}</em></div>
        <div class="admin-inspector-stats"><div><b>${formatDuration(user.totalTimeSec)}</b><small>Site time</small></div><div><b>${user.visitCount||0}</b><small>Visits</small></div><div><b>${profiles.length}</b><small>MC profiles</small></div><div><b>${getFriends(user.id).length}</b><small>Friends</small></div></div>
        <div class="admin-inspector-section"><div class="admin-inspector-section-head"><span>Minecraft identities</span><b>${profiles.length}</b></div>${profileRows||'<p class="admin-inspector-muted">No Minecraft profiles</p>'}${profiles.length>4?`<p class="admin-inspector-more">+${profiles.length-4} more profiles</p>`:''}</div>
        <div class="admin-inspector-meta"><span><small>Registered</small><b>${esc(user.registeredAt||'Unknown')}</b></span><span><small>Email</small><b>${esc(user.email||'Not provided')}</b></span><span><small>User ID</small><code>${esc(user.id)}</code></span></div>
        <div class="admin-inspector-actions"><button type="button" data-inspector-copy><i class="fas fa-copy"></i> Copy ID</button><button type="button" data-inspector-export><i class="fas fa-file-export"></i> Export user</button></div>`;
    panel.querySelector('[data-inspector-close]')?.addEventListener('click',()=>{adminInspectedUserId=null;renderAdminUserInspector(null);document.querySelectorAll('.admin-user-row').forEach(row=>row.classList.remove('is-inspected'));});
    panel.querySelector('[data-inspector-copy]')?.addEventListener('click',()=>copyLocalText(user.id,'User ID copied'));
    panel.querySelector('[data-inspector-export]')?.addEventListener('click',()=>exportAdminUsers([user],`user-${String(user.username||'account').replace(/[^a-z0-9_-]/gi,'-')}`));
}
function renderAdminUsers() {
    const list=document.getElementById('adminUsersList');
    if(!list)return;
    const viewer=siteUsers.find(u=>u.id===currentUserId);
    const allUsers=getAdminFilteredUsers();
    adminPage=Math.min(adminPage,Math.max(1,Math.ceil(allUsers.length/ADMIN_PAGE_SIZE)));
    const users=allUsers.slice((adminPage-1)*ADMIN_PAGE_SIZE,adminPage*ADMIN_PAGE_SIZE);
    renderAdminPagination(allUsers.length);
    const resultCount=document.getElementById('adminUserResultCount');
    const selectAllWrap=document.getElementById('adminSelectAllWrap');
    const selectAll=document.getElementById('adminSelectAllUsers');
    const manageableUsers=users.filter(user=>canAdminManageTarget(viewer,user));

    if(resultCount)resultCount.textContent=`${allUsers.length} ${allUsers.length===1?'user':'users'} · showing ${users.length}`;
    if(selectAllWrap)selectAllWrap.hidden=!manageableUsers.length;
    if(selectAll){
        const selectedVisible=manageableUsers.filter(user=>adminSelectedUserIds.has(user.id)).length;
        selectAll.checked=Boolean(manageableUsers.length&&selectedVisible===manageableUsers.length);
        selectAll.indeterminate=Boolean(selectedVisible&&selectedVisible<manageableUsers.length);
    }

    list.innerHTML='';
    if(!users.length){
        adminInspectedUserId=null;
        list.innerHTML='<div class="admin-empty admin-empty-state"><i class="fas fa-user-slash"></i><strong>No users found</strong><span>Try another query or clear the filters.</span></div>';
        renderAdminUserInspector(null);
        updateAdminBulkBar();
        return;
    }
    if(!users.some(user=>user.id===adminInspectedUserId))adminInspectedUserId=users[0].id;

    users.forEach(user=>{
        const manageable=canAdminManageTarget(viewer,user);
        const isSelf=user.id===currentUserId;
        const isSelected=adminSelectedUserIds.has(user.id);
        const isInspected=user.id===adminInspectedUserId;
        const online=isOnlineNow(user.lastSeen);
        const recent=isRecentlyActive(user.lastSeen,7);
        const mcCount=(loadMcAccounts(user.id)||[]).length;
        const allowedRoles=adminAllowedRoles(viewer);
        const roleOptions=allowedRoles.map(role=>`<option value="${role}"${user.role===role?' selected':''}>${esc(ROLES[role].label)}</option>`).join('');
        const roleControl=manageable
            ? `<select class="admin-role-select" aria-label="Role for ${esc(user.username)}">${roleOptions}</select>`
            : '<span class="admin-role-locked" title="You cannot manage this role"><i class="fas fa-lock"></i></span>';
        const badge=user.banned
            ? '<span class="role-badge role-banned"><i class="fas fa-ban"></i> Banned</span>'
            : roleBadgeHtml(user.role);
        const row=document.createElement('article');
        row.className=`admin-user-row${user.banned?' is-banned':''}${isSelected?' is-selected':''}${isInspected?' is-inspected':''}`;
        row.dataset.uid=user.id;
        row.innerHTML=`
            <div class="admin-user-picker">
                ${manageable?`<input class="admin-user-check" type="checkbox" aria-label="Select ${esc(user.username)}" ${isSelected?'checked':''}>`:'<i class="fas fa-shield-halved" title="Protected account"></i>'}
            </div>
            <div class="admin-user-avatar-wrap">
                <img class="admin-user-avatar" src="${esc(siteAvatarUrl(user))}" width="100" height="100" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback alt="">
                <span class="admin-presence ${online?'is-online':recent?'is-recent':''}" title="${online?'Online now':recent?'Recently active':'Offline'}"></span>
            </div>
            <div class="admin-user-main">
                <div class="admin-user-name-row">
                    <strong class="admin-user-name">${esc(user.displayName||user.username)}</strong>
                    ${badge}
                    ${isSelf?'<span class="admin-you-pill">You</span>':''}
                </div>
                <div class="admin-user-handle">@${esc(user.username)} <span>·</span> ${esc(user.bio||'No bio yet')}</div>
                <div class="admin-user-stats">
                    <span title="Minecraft identities"><i class="fas fa-cube"></i> ${mcCount} MC</span>
                    <span title="Total time on site"><i class="fas fa-clock"></i> ${formatDuration(user.totalTimeSec)}</span>
                    <span title="Visits"><i class="fas fa-right-to-bracket"></i> ${user.visitCount||0}</span>
                    <span title="Last seen"><i class="fas fa-eye"></i> ${timeAgo(user.lastSeen)}</span>
                </div>
            </div>
            <div class="admin-user-controls">
                <div class="admin-role-control">${roleControl}</div>
                <div class="admin-user-actions">
                    <button class="admin-act-btn inspect" data-act="inspect" type="button" aria-label="Inspect user"><i class="fas fa-arrow-right"></i></button>
                    ${manageable?`<button class="admin-act-btn ${user.banned?'unban':'ban'}" data-act="ban" type="button"><i class="fas fa-${user.banned?'unlock':'ban'}"></i><span>${user.banned?'Unban':'Ban'}</span></button>`:''}
                    ${isDev(viewer)&&!isSelf&&!validSupabaseConfig()?'<button class="admin-act-btn del" data-act="del" type="button" aria-label="Delete user"><i class="fas fa-trash-alt"></i></button>':''}
                </div>
            </div>`;

        const check=row.querySelector('.admin-user-check');
        if(check)check.addEventListener('change',event=>{
            event.stopPropagation();
            if(check.checked)adminSelectedUserIds.add(user.id);else adminSelectedUserIds.delete(user.id);
            renderAdminUsers();
        });
        const roleSelect=row.querySelector('.admin-role-select');
        if(roleSelect)roleSelect.addEventListener('change',event=>{
            event.stopPropagation();
            const target=siteUsers.find(candidate=>candidate.id===user.id);
            const actor=siteUsers.find(candidate=>candidate.id===currentUserId);
            if(!target||!canAdminManageTarget(actor,target)||!adminAllowedRoles(actor).includes(roleSelect.value)){
                showToast('This account is protected by the role hierarchy.','triangle-exclamation');
                renderAdminUsers();
                return;
            }
            reviewAdminAction('role',[target.id],roleSelect.value);
            roleSelect.value=target.role;
            window.SpectralControls?.refresh();
        });
        const inspect=()=>{
            adminInspectedUserId=user.id;
            renderAdminUsers();
        };
        row.querySelector('[data-act="inspect"]')?.addEventListener('click',event=>{event.stopPropagation();inspect();});
        row.addEventListener('click',event=>{
            if(event.target.closest('button,select,input'))return;
            inspect();
        });
        const banButton=row.querySelector('[data-act="ban"]');
        if(banButton)banButton.addEventListener('click',event=>{
            event.stopPropagation();
            const target=siteUsers.find(candidate=>candidate.id===user.id);
            const actor=siteUsers.find(candidate=>candidate.id===currentUserId);
            if(!target||!canAdminManageTarget(actor,target))return showToast('This account is protected.','triangle-exclamation');
            reviewAdminAction(target.banned?'unban':'ban',[target.id]);
        });
        const deleteButton=row.querySelector('[data-act="del"]');
        if(deleteButton)deleteButton.addEventListener('click',event=>{
            event.stopPropagation();
            reviewAdminAction('delete',[user.id]);
        });
        list.appendChild(row);
    });

    renderAdminUserInspector(users.find(user=>user.id===adminInspectedUserId)||users[0]);
    updateAdminBulkBar();
}

const adminSelectAllControl=document.getElementById('adminSelectAllUsers');
adminSelectAllControl?.addEventListener('change',()=>{
    const viewer=siteUsers.find(user=>user.id===currentUserId);
    getAdminFilteredUsers().slice((adminPage-1)*ADMIN_PAGE_SIZE,adminPage*ADMIN_PAGE_SIZE).filter(user=>canAdminManageTarget(viewer,user)).forEach(user=>{
        if(adminSelectAllControl.checked)adminSelectedUserIds.add(user.id);else adminSelectedUserIds.delete(user.id);
    });
    renderAdminUsers();
});
document.getElementById('adminBulkClear')?.addEventListener('click',()=>{
    adminSelectedUserIds.clear();
    renderAdminUsers();
});
document.getElementById('adminBulkApplyRole')?.addEventListener('click',()=>reviewAdminAction('role',selectedAdminUsers().map(user=>user.id),document.getElementById('adminBulkRole').value));
document.getElementById('adminBulkBan')?.addEventListener('click',()=>reviewAdminAction('ban',selectedAdminUsers().filter(user=>!user.banned).map(user=>user.id)));
document.getElementById('adminBulkUnban')?.addEventListener('click',()=>reviewAdminAction('unban',selectedAdminUsers().filter(user=>user.banned).map(user=>user.id)));
document.getElementById('adminBulkExport')?.addEventListener('click',()=>{
    const targets=selectedAdminUsers();
    if(!targets.length)return showToast('Select users to export.','triangle-exclamation');
    exportAdminUsers(targets,'selected-users');
});

function renderAdminForum() {
    if(!canModerate(currentRoleUser()))return;
    const list=document.getElementById('adminForumList');
    if(!list)return;
    updateAdminOverview();
    if(validSupabaseConfig()){list.innerHTML='<div class="admin-empty-state"><i class="fas fa-comments"></i><h3>Local community preview</h3><p>This project has no cloud forum service. Moderation is available in local demo mode.</p></div>';return;}
    const query=(document.getElementById('adminForumSearch')?.value||'').trim().toLowerCase();
    const statusOf=post=>post.rejected?'rejected':post.approved?'approved':'pending';
    const statusPriority={pending:0,approved:1,rejected:2};
    const posts=forumPosts.filter(post=>{
        const status=statusOf(post);
        const matchesStatus=adminForumFilter==='all'||status===adminForumFilter;
        const haystack=`${post.title||''} ${post.text||''} ${post.authorName||''}`.toLowerCase();
        return matchesStatus&&(!query||haystack.includes(query));
    }).sort((a,b)=>statusPriority[statusOf(a)]-statusPriority[statusOf(b)]||String(b.date||'').localeCompare(String(a.date||'')));
    const count=document.getElementById('adminForumResultCount');
    if(count)count.textContent=`${posts.length} ${posts.length===1?'post':'posts'}`;
    list.innerHTML='';
    if(!posts.length){
        list.innerHTML='<div class="admin-empty admin-empty-state"><i class="fas fa-inbox"></i><strong>Queue is clear</strong><span>No posts match the current view.</span></div>';
        return;
    }
    posts.forEach(post=>{
        const status=statusOf(post);
        const statusLabel=status[0].toUpperCase()+status.slice(1);
        const item=document.createElement('article');
        item.className=`admin-forum-item is-${status}`;
        item.innerHTML=`
            <div class="admin-forum-item-head">
                <div class="admin-forum-signal"><i class="fas fa-${status==='pending'?'clock':status==='approved'?'check':'xmark'}"></i></div>
                <div class="admin-forum-copy">
                    <div class="admin-forum-title-row">
                        <h4 class="admin-forum-title">${esc(post.title||'Untitled idea')}</h4>
                        <span class="admin-forum-status afs-${status}">${statusLabel}</span>
                    </div>
                    <div class="admin-forum-meta">by ${esc(post.authorName||'Unknown')} <span>·</span> ${esc(post.date||'No date')} <span>·</span> ${(post.upvotes||[]).length} upvote${(post.upvotes||[]).length===1?'':'s'}</div>
                </div>
            </div>
            <p class="admin-forum-preview">${esc(String(post.text||'').slice(0,220))}${String(post.text||'').length>220?'…':''}</p>
            <div class="admin-forum-actions">
                ${status!=='approved'?`<button class="admin-forum-approve" data-action="approve" type="button"><i class="fas fa-check"></i> ${status==='rejected'?'Restore':'Approve'}</button>`:''}
                ${status!=='rejected'?'<button class="admin-forum-reject" data-action="reject" type="button"><i class="fas fa-xmark"></i> Reject</button>':''}
                <button class="admin-forum-delete" data-action="delete" type="button"><i class="fas fa-trash-alt"></i> Delete</button>
            </div>`;
        item.querySelector('[data-action="approve"]')?.addEventListener('click',()=>{
            if(!canModerate(currentRoleUser())||validSupabaseConfig())return;
            const target=forumPosts.find(candidate=>candidate.id===post.id);
            if(!target)return;
            target.approved=true;
            target.rejected=false;
            saveForum(forumPosts);
            renderAdminForum();
            renderForum();
            showToast('Post approved.','check');
        });
        item.querySelector('[data-action="reject"]')?.addEventListener('click',()=>{
            if(!canModerate(currentRoleUser())||validSupabaseConfig())return;
            const target=forumPosts.find(candidate=>candidate.id===post.id);
            if(!target)return;
            target.approved=false;
            target.rejected=true;
            saveForum(forumPosts);
            renderAdminForum();
            renderForum();
            showToast('Post moved to rejected.','check');
        });
        item.querySelector('[data-action="delete"]')?.addEventListener('click',()=>{
            showConfirm('Delete this idea permanently?',()=>{
                if(!canModerate(currentRoleUser())||validSupabaseConfig())return;
                forumPosts=forumPosts.filter(candidate=>candidate.id!==post.id);
                saveForum(forumPosts);
                renderAdminForum();
                renderForum();
            });
        });
        list.appendChild(item);
    });
}

function renderAdminStats() {
    const grid=document.getElementById('adminStatsGrid');if(!grid)return;
    updateAdminOverview();
    const viewer=siteUsers.find(u=>u.id===currentUserId);
    const dev=isDev(viewer);

    const totalUsers=siteUsers.length;
    const totalMc=siteUsers.reduce((s,u)=>s+(loadMcAccounts(u.id)||[]).length,0);
    const totalIdeas=forumPosts.length;
    const approved=forumPosts.filter(p=>p.approved).length;
    const pending=forumPosts.filter(p=>!p.approved&&!p.rejected).length;
    const totalTime=siteUsers.reduce((s,u)=>s+(u.totalTimeSec||0),0);
    const withTime=siteUsers.filter(u=>(u.totalTimeSec||0)>0);
    const avgTime=withTime.length?totalTime/withTime.length:0;
    const totalVisits=siteUsers.reduce((s,u)=>s+(u.visitCount||0),0);
    const active7=siteUsers.filter(u=>isRecentlyActive(u.lastSeen,7)).length;
    const banned=siteUsers.filter(u=>u.banned).length;
    const newThisWeek=siteUsers.filter(u=>registeredWithinDays(u.registeredAt,7)).length;

    const boxes=[
        {val:totalUsers,                 label:'Site Users',         icon:'fas fa-users'},
        {val:formatDuration(avgTime),    label:'Avg Time / User',    icon:'fas fa-hourglass-half'},
        {val:totalMc,                    label:'Minecraft Profiles', icon:'fas fa-cube'},
        {val:approved,                   label:'Ideas Approved',     icon:'fas fa-lightbulb'}
    ];
    grid.innerHTML=boxes.map(s=>`<div class="admin-stat-box"><div class="admin-stat-ico"><i class="${s.icon}"></i></div><div class="admin-stat-val">${s.val}</div><div class="admin-stat-label">${s.label}</div></div>`).join('');

    const extra=document.getElementById('adminStatsExtra');
    if(!extra)return;
    if(!dev){ extra.innerHTML='<p class="admin-empty">Advanced analytics are available to Developers only.</p>'; return; }

    // ── Secondary metrics ──
    const sec=[
        {val:formatDuration(totalTime),                         label:'Total Time on Site'},
        {val:totalVisits,                                       label:'Total Visits'},
        {val:active7,                                           label:'Active (7 days)'},
        {val:newThisWeek,                                       label:'New This Week'},
        {val:totalUsers?(totalMc/totalUsers).toFixed(1):'0',    label:'Avg MC / User'},
        {val:pending,                                           label:'Ideas Pending'},
        {val:banned,                                            label:'Banned Users'},
        {val:totalIdeas,                                        label:'Total Ideas'}
    ];

    // ── Role distribution ──
    const roleCounts={}; ROLE_ORDER.forEach(r=>roleCounts[r]=0);
    siteUsers.forEach(u=>{ roleCounts[ROLE_ORDER.includes(u.role)?u.role:'USER']++; });
    const roleBars=ROLE_ORDER.slice().reverse().map(r=>{
        const c=roleCounts[r], pct=totalUsers?Math.round(c/totalUsers*100):0;
        return `<div class="dist-row"><span class="dist-label"><i class="${ROLES[r].icon}" style="color:${ROLES[r].color}"></i> ${ROLES[r].label}</span><div class="dist-bar"><div class="dist-fill" style="width:${pct}%;background:${ROLES[r].grad}"></div></div><span class="dist-val">${c}</span></div>`;
    }).join('');

    // ── Account type distribution ──
    const typeCounts={microsoft:0,elyby:0,offline:0};
    siteUsers.forEach(u=>(loadMcAccounts(u.id)||[]).forEach(a=>{ if(typeCounts[a.type]!==undefined)typeCounts[a.type]++; }));
    const typeColors={microsoft:'linear-gradient(135deg,#3b82f6,#2563eb)',elyby:'linear-gradient(135deg,#22d3ee,#0891b2)',offline:'linear-gradient(135deg,#a78bfa,#7c3aed)'};
    const typeBars=Object.keys(typeCounts).map(t=>{
        const c=typeCounts[t], pct=totalMc?Math.round(c/totalMc*100):0;
        return `<div class="dist-row"><span class="dist-label"><i class="${typeIcon(t)}"></i> ${typeLabel(t)}</span><div class="dist-bar"><div class="dist-fill" style="width:${pct}%;background:${typeColors[t]}"></div></div><span class="dist-val">${c}</span></div>`;
    }).join('');

    // ── Leaderboards ──
    const top=siteUsers.slice().sort((a,b)=>(b.totalTimeSec||0)-(a.totalTimeSec||0)).slice(0,5);
    const topRows=top.map((u,i)=>`<div class="lead-row"><span class="lead-rank">#${i+1}</span><img class="lead-av" src="${esc(siteAvatarUrl(u))}" alt="${esc(u.displayName||u.username)}" width="100" height="100" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback><span class="lead-name">${esc(u.displayName||u.username)} ${roleBadgeHtml(u.role)}</span><span class="lead-time">${formatDuration(u.totalTimeSec)}</span></div>`).join('');
    const recent=siteUsers.slice().sort((a,b)=>parseRegDate(b.registeredAt)-parseRegDate(a.registeredAt)).slice(0,5);
    const recentRows=recent.map(u=>`<div class="lead-row"><img class="lead-av" src="${esc(siteAvatarUrl(u))}" alt="${esc(u.displayName||u.username)}" width="100" height="100" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback><span class="lead-name">${esc(u.displayName||u.username)} ${roleBadgeHtml(u.role)}</span><span class="lead-time">${esc(u.registeredAt||'?')}</span></div>`).join('');

    extra.innerHTML=`
        <div class="admin-stats-grid secondary">${sec.map(s=>`<div class="admin-stat-box sm"><div class="admin-stat-val">${s.val}</div><div class="admin-stat-label">${s.label}</div></div>`).join('')}</div>
        <div class="dev-panels">
            <div class="dev-card"><h4><i class="fas fa-id-badge"></i> Role Distribution</h4>${roleBars}</div>
            <div class="dev-card"><h4><i class="fas fa-layer-group"></i> Account Types</h4>${typeBars||'<p class="admin-empty">No profiles yet</p>'}</div>
            <div class="dev-card"><h4><i class="fas fa-trophy"></i> Top Time on Site</h4>${topRows||'<p class="admin-empty">No data</p>'}</div>
            <div class="dev-card"><h4><i class="fas fa-user-plus"></i> Recent Signups</h4>${recentRows}</div>
        </div>
        <div class="dev-tools">
            <h4><i class="fas fa-screwdriver-wrench"></i> Developer Tools</h4>
            <div class="dev-tools-row">
                <button class="dev-tool-btn" id="devExportBtn"><i class="fas fa-file-export"></i> Export Database</button>
                <button class="dev-tool-btn" id="devReloadBtn" ${cloudAuthUserId?'':'disabled'}><i class="fas fa-rotate"></i> Reload My Account</button>
                <button class="dev-tool-btn danger" id="devResetBtn"><i class="fas fa-triangle-exclamation"></i> Reset Local Data</button>
            </div>
            <p class="dev-tools-note">Remote scope: <code>${cloudAuthUserId?'authenticated account only':'none — local demo only'}</code></p>
        </div>`;

    const ex=document.getElementById('devExportBtn'); if(ex)ex.addEventListener('click',exportDatabase);
    const rl=document.getElementById('devReloadBtn'); if(rl)rl.addEventListener('click',async()=>{if(!cloudAuthUserId)return;rl.disabled=true;rl.innerHTML='<i class="fas fa-rotate fa-spin"></i> Reloading...';try{const {data}=await cloud.auth.getSession();await cloudBootstrap(data?.session?.user||null);if(dashOverlay&&dashOverlay.classList.contains('open')){updateAdminOverview();openAdminSection('site-stats');}}catch(error){console.warn('[cloud] manual reload failed:',error.message||error);showToast('Account sync failed','triangle-exclamation');}finally{rl.disabled=false;rl.innerHTML='<i class="fas fa-rotate"></i> Reload My Account';}});
    const rs=document.getElementById('devResetBtn'); if(rs)rs.addEventListener('click',()=>{ showConfirm('Clear ALL local demo data on this device? Authenticated remote data is not deleted.',()=>{ try{Object.keys(localStorage).filter(k=>k.startsWith('spectral_')).forEach(k=>localStorage.removeItem(k));}catch{} location.reload(); }); });
}
/*
 * Account workspaces v2.
 * The old role/admin views shared several renderers and event listeners. This
 * file replaces those surfaces with two small state machines and one delegated
 * listener per panel. It intentionally keeps authorization helpers and storage
 * primitives from the core model, while owning all UI state itself.
 */
function replaceWorkspaceNode(selector){
    const current=document.querySelector(selector);
    if(!current)return null;
    const fresh=current.cloneNode(selector==='#profileTabs');
    fresh.removeAttribute('style');
    if(current.hidden||current.getAttribute('aria-hidden')==='true')fresh.hidden=true;
    current.replaceWith(fresh);
    return fresh;
}

const rolesPanelV2=replaceWorkspaceNode('#profilePanelRoles');
const adminPanelV2=replaceWorkspaceNode('#profilePanelAdmin');
const profileTabsV2=replaceWorkspaceNode('#profileTabs');

const rolesV2={cycle:'yearly',category:'capacity',quote:null,closeTimer:0};
const adminV2={tab:'users',page:1,pageSize:10,query:'',role:'',status:'',sort:'role',forumFilter:'pending',forumQuery:'',selected:new Set(),inspect:null,pending:null,forumPending:null,busy:false,loading:false};
const workspaceAnimations=new WeakMap();
const workspaceMotionSnapshots=new WeakMap();
let profileSwitchTimer=0;
let adminSwitchTimer=0;

function interruptWorkspaceMotion(element){
    if(!element)return;
    const animation=workspaceAnimations.get(element),fallback=element.classList.contains('workspace-reveal-fallback');
    if(animation?.playState==='running'||fallback){
        const style=getComputedStyle(element);
        workspaceMotionSnapshots.set(element,{transform:style.transform,opacity:style.opacity,at:performance.now()});
    }
    animation?.cancel();
    workspaceAnimations.delete(element);
    element.classList.remove('workspace-reveal-fallback');
}

function revealWorkspaceContent(element,direction=1,{distance=16,duration=360,fade=true}={}){
    if(!element)return;
    interruptWorkspaceMotion(element);
    const saved=workspaceMotionSnapshots.get(element);
    const snapshot=saved&&performance.now()-saved.at<500?saved:null;
    workspaceMotionSnapshots.delete(element);
    if(REDUCED_MOTION||liteOn())return;
    const startTransform=snapshot?.transform&&snapshot.transform!=='none'?snapshot.transform:`translate3d(${direction*distance}px,6px,0)`;
    const startOpacity=fade?Number(snapshot?.opacity??.82):1;
    if(typeof element.animate!=='function'){
        element.style.setProperty('--workspace-reveal-start',startTransform);
        element.style.setProperty('--workspace-reveal-opacity',String(startOpacity));
        void element.offsetWidth;
        element.classList.add('workspace-reveal-fallback');
        return;
    }
    const animation=element.animate([
        {opacity:startOpacity,transform:startTransform},
        {opacity:1,transform:'translate3d(0,0,0)'}
    ],{duration,easing:'cubic-bezier(.22,1,.36,1)'});
    workspaceAnimations.set(element,animation);
    animation.finished.catch(()=>{}).finally(()=>{if(workspaceAnimations.get(element)===animation)workspaceAnimations.delete(element);});
}

function workspaceIcon(icon){return `<i class="fas fa-${icon}" aria-hidden="true"></i>`;}
function workspaceRoleKeys(user){return isDev(user)?ROLE_ORDER:['VETERAN',...PREMIUM_ROLES];}
function workspaceRoleOrder(userId){return loadRoleOrders().find(order=>order.userId===userId&&order.status==='reserved')||null;}
function workspaceUser(){return siteUsers.find(user=>user.id===currentUserId)||null;}

function renderRolesShell(){
    if(!rolesPanelV2)return;
    rolesPanelV2.innerHTML=`<div class="roles-v2-shell">
        <header class="roles-v2-hero">
            <div class="roles-v2-hero-copy"><span class="roles-v2-eyebrow"><span class="roles-v2-live-dot"></span> SPECTRAL / ROLE STUDIO</span><h2>Choose your <em>next form.</em></h2><p>Every role has its own look, room for more identities, and a different way to move through Spectral. Explore the collection before saving a plan.</p><div class="roles-v2-hero-points"><span><b>01</b> Explore</span><span><b>02</b> Compare</span><span><b>03</b> Save for launch</span></div></div>
            <div class="roles-v2-hero-display" aria-hidden="true"><span class="roles-v2-display-ring ring-one"></span><span class="roles-v2-display-ring ring-two"></span><span class="roles-v2-display-gem">${workspaceIcon('gem')}</span><small>IDENTITY / EVOLVED</small></div>
            <div class="roles-v2-current"><span id="rolesV2CurrentIcon">${workspaceIcon('user')}</span><div><small id="rolesV2CurrentLabel">YOUR CURRENT ROLE</small><strong id="rolesV2CurrentName">Player</strong><em id="rolesV2CurrentNote">Standard access</em></div></div>
        </header>
        <div class="roles-v2-sectionline"><span>YOUR ACCESS NOW</span><span>LIVE ACCOUNT LIMITS</span></div>
        <section id="rolesV2Entitlements" class="roles-v2-entitlements" aria-label="Current account limits"></section>
        <section id="developerRoleLab" class="roles-v2-preview" hidden></section>
        <section id="roleReservation" class="roles-v2-reservation" hidden aria-live="polite"></section>
        <div class="roles-v2-toolbar"><div><small>THE COLLECTION / 01</small><h3>Find your role</h3><p>Distinct identities, clear limits, and pricing you can compare.</p></div><div class="roles-v2-cycle" role="group" aria-label="Billing period"><button type="button" data-role-v2-cycle="monthly" aria-pressed="false">Monthly</button><button type="button" class="active" data-role-v2-cycle="yearly" aria-pressed="true">Yearly <b>SAVE 20%</b></button></div></div>
        <div id="roleStoreGrid" class="roles-v2-grid" aria-live="polite"></div>
        <section class="roles-v2-compare"><header><span>${workspaceIcon('table-cells-large')}</span><div><small>THE DETAILS / 02</small><h3>Compare every detail</h3><p>See exactly what changes across capacity, appearance, and access.</p></div></header><div class="roles-v2-compare-tabs" role="group" aria-label="Role comparison"><button type="button" data-role-v2-category="capacity" aria-pressed="true">${workspaceIcon('cubes')} Capacity</button><button type="button" data-role-v2-category="appearance" aria-pressed="false">${workspaceIcon('palette')} Appearance</button><button type="button" data-role-v2-category="permissions" aria-pressed="false">${workspaceIcon('shield-halved')} Permissions</button></div><div id="roleComparisonGrid" class="roles-v2-table-wrap" tabindex="0"></div><p class="roles-v2-note">${workspaceIcon('circle-info')} Saving a launch choice on this device does not charge you or activate a role. Staff access is assigned by the server.</p></section>
        <aside id="roleCheckoutSheet" class="roles-v2-checkout" hidden aria-live="polite"><button type="button" data-role-v2-close class="roles-v2-close" aria-label="Close role choice">×</button><span id="rolesV2CheckoutIcon">${workspaceIcon('star')}</span><div><small>YOUR SELECTION / 03</small><h3 id="rolesV2CheckoutTitle">Pro</h3><p id="rolesV2CheckoutText">Save this plan to revisit at launch.</p></div><div class="roles-v2-checkout-total"><strong id="rolesV2CheckoutPrice">$0</strong><small id="rolesV2CheckoutPeriod">per year</small></div><button type="button" data-role-v2-confirm class="roles-v2-confirm">Save plan ${workspaceIcon('arrow-right')}</button></aside>
    </div>`;
}

function renderRolesEntitlements(user){
    const el=document.getElementById('rolesV2Entitlements');if(!el)return;
    const info=roleInfo(user.role),mc=loadMcAccounts(user.id)||[],fav=mc.filter(item=>item.favorite).length;
    const metric=(icon,label,value,limit)=>`<article><span>${workspaceIcon(icon)} ${label}</span><strong>${value}<small> / ${formatRoleLimit(limit)}</small></strong><div><i style="width:${Number.isFinite(limit)?Math.min(100,(value/Math.max(1,limit))*100):Math.min(100,value*6)}%"></i></div><em>${esc(info.label)} access</em></article>`;
    el.innerHTML=metric('cubes','Launcher profiles',mc.length,info.profileLimit)+metric('star','Favorites',fav,info.favoriteLimit)+`<article><span>${workspaceIcon('shield-halved')} Permissions</span><strong>${isDev(user)?'Developer':canManageUsers(user)?'Admin':canModerate(user)?'Moderator':'Player'}</strong><em>${isDev(user)?'Full workspace and safe role previews':canManageUsers(user)?'Manage lower roles and access':canModerate(user)?'Review community queue':'Manage your own identities'}</em></article>`;
}

function renderRolesPreview(user,displayRole){
    const lab=document.getElementById('developerRoleLab');if(!lab)return;
    if(!isDev(user)){lab.hidden=true;lab.innerHTML='';return;}
    const role=roleInfo(displayRole);lab.hidden=false;lab.innerHTML=`<span>${workspaceIcon('flask-vial')}</span><div><small>DEVELOPER PREVIEW</small><strong>${esc(role.label)} appearance</strong><p>Only the visual preview changes. Your actual Developer permissions remain active.</p></div><button type="button" data-role-v2-reset ${displayRole==='DEV'?'disabled':''}>${workspaceIcon('rotate-left')} Reset</button>`;
}

function roleCard(user,key,index){
    const info=roleInfo(key),display=displayedRoleKey(user),developer=isDev(user),current=display===key,chosen=workspaceRoleOrder(user.id),reserved=chosen?.role===key,eligible=key==='VETERAN'&&isVeteranEligible(user),plan=ROLE_STORE_PLANS[key];
    const locked=!developer&&key==='VETERAN'&&!current;
    const state=current?'current':reserved?'reserved':locked?'locked':'';
    const label=current?'Current role':developer?`Preview ${info.label}`:reserved?'Saved for launch':locked?(eligible?'Assigned automatically':'Founder role'):'Explore plan';
    const action=developer?'preview':key==='VETERAN'?'none':'choose';
    const icon=workspaceIcon(info.icon.replace('fas fa-',''));
    const status=current?'ACTIVE':reserved?'SAVED':developer?'VISUAL PREVIEW':key==='VETERAN'?'FOUNDER LEGACY':key==='LEGEND'?'COMMUNITY FAVORITE':key==='SPECTRAL'?'COMPLETE ACCESS':'EVERYDAY UPGRADE';
    const price=plan?`<strong class="role-v2-price">$${plan[rolesV2.cycle].toFixed(2)}</strong><span class="role-v2-price-unit">/ ${rolesV2.cycle==='yearly'?'year':'month'}</span>`:developer?'<strong class="role-v2-price-word">Preview only</strong>':`<strong class="role-v2-price-word">${eligible?'Earned forever':'Founders only'}</strong>`;
    const priceNote=plan?(rolesV2.cycle==='yearly'?`About $${(plan.yearly/12).toFixed(2)}/mo · annual total shown`:'Indicative monthly price · no charge today'):developer?'Appearance preview · no purchase':'A permanent badge from the founding year';
    return `<article class="role-v2-card role-v2-${key.toLowerCase()} ${state} ${key==='PRO'?'featured':''}" style="--role-color:${info.color};--role-delay:${index*42}ms" data-role-v2-card="${key}">
        <div class="role-v2-art" aria-hidden="true"><span class="role-v2-art-grid"></span><span class="role-v2-art-orbit"></span><span class="role-v2-art-emblem">${icon}</span><span class="role-v2-art-number">0${index+1} / 0${workspaceRoleKeys(user).length}</span></div>
        <div class="role-v2-card-top"><span class="role-v2-card-monogram">${icon}</span><small>${status}</small></div>
        <div class="role-v2-card-name"><h4>${esc(info.label)}</h4><p>${esc(info.tagline)}</p></div>
        <div class="role-v2-price-wrap"><div>${price}</div><small>${priceNote}</small></div>
        <div class="role-v2-capacity"><span>${workspaceIcon('cubes')} <b>${formatRoleLimit(roleProfileLimit(key))}</b> profiles</span><span>${workspaceIcon('star')} <b>${formatRoleLimit(roleFavoriteLimit(key))}</b> favorites</span></div>
        <div class="role-v2-benefits-label">INCLUDED WITH ${esc(info.label).toUpperCase()}</div>
        <ul>${info.perks.slice(1,4).map(perk=>`<li>${workspaceIcon('check')} <span>${esc(perk)}</span></li>`).join('')}</ul>
        <button type="button" data-role-v2-action="${action}" data-role-v2-key="${key}" ${action==='none'||current||reserved?'disabled':''}><span>${label}</span>${workspaceIcon(developer?'eye':current?'check':reserved?'bookmark':'arrow-right')}</button>
    </article>`;
}

function renderRolesCards(user){
    const grid=document.getElementById('roleStoreGrid');if(!grid)return;
    grid.innerHTML=workspaceRoleKeys(user).map((key,index)=>roleCard(user,key,index)).join('');
}

function renderRolesCompare(user){
    const grid=document.getElementById('roleComparisonGrid');if(!grid)return;
    const keys=rolesV2.category==='permissions'?['USER','PRO','SPECTRAL','MODERATOR','ADMIN','DEV']:['USER','VETERAN','PRO','LEGEND','SPECTRAL'];
    const rows=rolesV2.category==='capacity'?[['Profiles',key=>formatRoleLimit(roleProfileLimit(key))],['Favorites',key=>formatRoleLimit(roleFavoriteLimit(key))],['Source',key=>key==='VETERAN'?'Founder':PREMIUM_ROLES.includes(key)?'Launch choice':'Included']]:rolesV2.category==='appearance'?[['Header',key=>PROFILE_HEADERS[ROLE_DEFAULT_HEADERS[key]]?.label||'Included'],['Entrance',key=>PROFILE_ENTRANCES[ROLE_DEFAULT_ENTRANCES[key]]?.label||'Included'],['Badge',key=>roleInfo(key).label]]:[['Own profile',()=>true],['Review ideas',key=>roleRank(key)>=10],['Manage roles',key=>roleRank(key)>=20],['Developer preview',key=>key==='DEV']];
    grid.innerHTML=`<table><thead><tr><th>Feature</th>${keys.map(key=>`<th class="${key===user.role?'is-current':''}">${workspaceIcon(roleInfo(key).icon.replace('fas fa-',''))}<span>${esc(roleInfo(key).label)}</span>${key===user.role?'<small>YOU</small>':''}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,read])=>`<tr><th>${label}</th>${keys.map(key=>{const value=read(key);return `<td>${typeof value==='boolean'?`<span class="role-v2-permission ${value?'yes':'no'}">${workspaceIcon(value?'check':'minus')}<b>${value?'Included':'—'}</b></span>`:esc(value)}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderRoleWorkspaceV2(){
    const user=workspaceUser();if(!user||!rolesPanelV2)return;
    const display=displayedRoleKey(user),info=roleInfo(display);
    const icon=document.getElementById('rolesV2CurrentIcon');if(icon)icon.innerHTML=workspaceIcon(info.icon.replace('fas fa-',''));
    const name=document.getElementById('rolesV2CurrentName');if(name)name.textContent=info.label;
    const note=document.getElementById('rolesV2CurrentNote');if(note)note.textContent=isDev(user)&&display!=='DEV'?'Preview only · Developer access stays active':info.tagline;
    renderRolesEntitlements(user);renderRolesPreview(user,display);renderRolesCards(user);renderRolesCompare(user);
    const saved=workspaceRoleOrder(user.id),checkout=document.getElementById('roleReservation');
    if(checkout){checkout.hidden=!saved;if(saved)checkout.innerHTML=`<span>${workspaceIcon('bookmark')}</span><div><small>SAVED FOR LAUNCH · THIS DEVICE</small><strong>${esc(roleInfo(saved.role).label)} <i>·</i> ${saved.billing==='yearly'?'Yearly':'Monthly'}</strong><p>$${Number(saved.quotedPrice).toFixed(2)} indicative ${saved.billing==='yearly'?'annual':'monthly'} price · no charge or role activation</p></div><button type="button" data-role-v2-remove>${workspaceIcon('xmark')} Remove</button>`;}
}

function openRoleCheckoutV2(key){
    const user=workspaceUser(),plan=ROLE_STORE_PLANS[key],sheet=document.getElementById('roleCheckoutSheet');if(!user||!plan||!sheet)return;
    clearTimeout(rolesV2.closeTimer);
    rolesV2.quote={userId:user.id,role:key,billing:rolesV2.cycle,price:plan[rolesV2.cycle]};
    sheet.hidden=false;sheet.dataset.role=key.toLowerCase();document.getElementById('rolesV2CheckoutIcon').innerHTML=workspaceIcon(roleInfo(key).icon.replace('fas fa-',''));document.getElementById('rolesV2CheckoutTitle').textContent=`${roleInfo(key).label} · ${rolesV2.cycle==='yearly'?'Yearly':'Monthly'}`;document.getElementById('rolesV2CheckoutText').textContent=`${roleProfileLimit(key)===Infinity?'Unlimited':formatRoleLimit(roleProfileLimit(key))} profiles · ${roleFavoriteLimit(key)===Infinity?'unlimited':formatRoleLimit(roleFavoriteLimit(key))} favorites. No payment or role activation today.`;document.getElementById('rolesV2CheckoutPrice').textContent=`$${plan[rolesV2.cycle].toFixed(2)}`;document.getElementById('rolesV2CheckoutPeriod').textContent=rolesV2.cycle==='yearly'?'per year':'per month';requestAnimationFrame(()=>sheet.classList.add('is-open'));
}
function closeRoleCheckoutV2(){const sheet=document.getElementById('roleCheckoutSheet');if(!sheet)return;sheet.classList.remove('is-open');rolesV2.quote=null;clearTimeout(rolesV2.closeTimer);rolesV2.closeTimer=window.setTimeout(()=>{sheet.hidden=true;},180);}
function saveRoleChoiceV2(){
    const quote=rolesV2.quote,user=workspaceUser();if(!quote||!user||quote.userId!==user.id)return;
    const orders=loadRoleOrders().filter(item=>item.userId!==user.id);orders.push({id:`role_${crypto.randomUUID()}`,userId:user.id,role:quote.role,billing:quote.billing,quotedPrice:quote.price,currency:'USD',status:'reserved',createdAt:new Date().toISOString()});
    if(!saveRoleOrders(orders))return showToast('This browser could not save the choice.','triangle-exclamation');
    closeRoleCheckoutV2();renderRoleWorkspaceV2();showToast(`${roleInfo(quote.role).label} launch choice saved.`,'check');
}

function bindRolesV2(){
    if(!rolesPanelV2)return;
    renderRolesShell();
    rolesPanelV2.addEventListener('pointermove',event=>{
        if(event.pointerType!=='mouse'||REDUCED_MOTION||liteOn())return;
        const card=event.target.closest('.role-v2-card');if(!card)return;
        const bounds=card.getBoundingClientRect();
        card.style.setProperty('--role-pointer-x',`${Math.max(0,Math.min(100,(event.clientX-bounds.left)/bounds.width*100))}%`);
        card.style.setProperty('--role-pointer-y',`${Math.max(0,Math.min(100,(event.clientY-bounds.top)/bounds.height*100))}%`);
    });
    rolesPanelV2.addEventListener('click',event=>{
        const cycle=event.target.closest('[data-role-v2-cycle]');if(cycle){if(rolesV2.quote)closeRoleCheckoutV2();rolesV2.cycle=cycle.dataset.roleV2Cycle;rolesPanelV2.querySelectorAll('[data-role-v2-cycle]').forEach(button=>{button.classList.toggle('active',button===cycle);button.setAttribute('aria-pressed',String(button===cycle));});renderRoleWorkspaceV2();return;}
        const category=event.target.closest('[data-role-v2-category]');if(category){const order=['capacity','appearance','permissions'],previous=rolesV2.category,next=category.dataset.roleV2Category;if(previous===next)return;rolesV2.category=next;rolesPanelV2.querySelectorAll('[data-role-v2-category]').forEach(button=>{button.classList.toggle('active',button===category);button.setAttribute('aria-pressed',String(button===category));});renderRolesCompare(workspaceUser());revealWorkspaceContent(document.getElementById('roleComparisonGrid'),order.indexOf(next)>order.indexOf(previous)?1:-1,{distance:9,duration:280});return;}
        const action=event.target.closest('[data-role-v2-action]');if(action&&!action.disabled){if(action.dataset.roleV2Action==='preview'){const user=workspaceUser();if(user&&setDeveloperRolePreview(user,action.dataset.roleV2Key)){renderNavbar();renderRoleWorkspaceV2();activateProfileTabV2('my-profile');showToast(`Preview: ${roleInfo(action.dataset.roleV2Key).label}.`,'eye');}}else if(action.dataset.roleV2Action==='choose')openRoleCheckoutV2(action.dataset.roleV2Key);return;}
        if(event.target.closest('[data-role-v2-reset]')){const user=workspaceUser();if(user&&setDeveloperRolePreview(user,'DEV')){renderNavbar();renderRoleWorkspaceV2();}return;}
        if(event.target.closest('[data-role-v2-remove]')){const user=workspaceUser();if(user&&saveRoleOrders(loadRoleOrders().filter(item=>item.userId!==user.id))){renderRoleWorkspaceV2();showToast('Saved plan removed.','check');}return;}
        if(event.target.closest('[data-role-v2-close]')){closeRoleCheckoutV2();return;}
        if(event.target.closest('[data-role-v2-confirm]'))saveRoleChoiceV2();
    });
}

function adminV2Template(){
    if(!adminPanelV2)return;
    adminPanelV2.innerHTML=`<div class="admin-v2-shell"><header class="admin-v2-header"><div><span class="admin-v2-kicker">${workspaceIcon('shield-halved')} ADMIN WORKSPACE</span><h2>Keep access understandable.</h2><p>Review people, changes, community posts and site health from one calm workspace.</p></div><div id="adminV2Connection" class="admin-v2-connection"></div></header><div id="adminV2Metrics" class="admin-v2-metrics"></div><nav id="adminV2Nav" class="admin-v2-nav" role="tablist" aria-label="Admin workspace sections"><button data-admin-v2-tab="users" role="tab">${workspaceIcon('users')}<strong>Users</strong><small>Accounts &amp; access</small><b></b></button><button data-admin-v2-tab="forum" role="tab">${workspaceIcon('comments')}<strong>Forum</strong><small>Community queue</small><b></b></button><button data-admin-v2-tab="activity" role="tab">${workspaceIcon('clock-rotate-left')}<strong>Activity</strong><small>Reviewed changes</small><b></b></button><button data-admin-v2-tab="analytics" role="tab">${workspaceIcon('chart-line')}<strong>Analytics</strong><small>Site overview</small><b></b></button></nav><section id="adminV2Review" class="admin-v2-review" hidden></section><div id="adminV2Views"><section data-admin-v2-view="users" role="tabpanel"><div class="admin-v2-toolbar"><label>${workspaceIcon('search')}<input data-admin-v2-search type="search" placeholder="Find a person…" autocomplete="off"><kbd>Ctrl K</kbd></label><select data-admin-v2-filter="role" aria-label="Role filter"><option value="">All roles</option>${ROLE_ORDER.map(key=>`<option value="${key}">${esc(roleInfo(key).label)}</option>`).join('')}</select><select data-admin-v2-filter="status" aria-label="Status filter"><option value="">All statuses</option><option value="online">Online now</option><option value="banned">Banned</option><option value="active">Active this week</option></select><select data-admin-v2-filter="sort" aria-label="Sort users"><option value="role">Highest role</option><option value="recent">Recently active</option><option value="name">Name A–Z</option><option value="time">Most time</option></select></div><div class="admin-v2-list-head"><label><input data-admin-v2-select-all type="checkbox"> Select visible</label><span data-admin-v2-count></span><button data-admin-v2-clear>Clear selection</button></div><div data-admin-v2-bulk class="admin-v2-bulk" hidden></div><div class="admin-v2-users"><div data-admin-v2-list class="admin-v2-list"></div><aside data-admin-v2-inspector class="admin-v2-inspector"></aside></div><nav data-admin-v2-pages class="admin-v2-pages" aria-label="User pages"></nav></section><section data-admin-v2-view="forum" role="tabpanel" hidden><div class="admin-v2-section-heading"><div><small>COMMUNITY QUEUE</small><h3>Review ideas with context.</h3></div><span data-admin-v2-forum-count></span></div><div data-admin-v2-forum class="admin-v2-forum"></div></section><section data-admin-v2-view="activity" role="tabpanel" hidden><div class="admin-v2-section-heading"><div><small>ACCOUNT HISTORY</small><h3>Every reviewed change has a reason.</h3></div></div><div data-admin-v2-audit class="admin-v2-audit"></div></section><section data-admin-v2-view="analytics" role="tabpanel" hidden><div class="admin-v2-section-heading"><div><small>SITE OVERVIEW</small><h3>What is happening right now?</h3></div></div><div data-admin-v2-analytics class="admin-v2-analytics"></div></section></div></div>`;
    adminPanelV2.querySelector('[data-admin-v2-forum]').insertAdjacentHTML('beforebegin',`<div class="admin-v2-forum-tools"><label>${workspaceIcon('search')}<input data-admin-v2-forum-search type="search" placeholder="Search ideas or authors" aria-label="Search ideas or authors"></label><div role="group" aria-label="Idea status"><button type="button" data-admin-v2-forum-filter="pending">Pending</button><button type="button" data-admin-v2-forum-filter="all">All</button><button type="button" data-admin-v2-forum-filter="approved">Approved</button><button type="button" data-admin-v2-forum-filter="rejected">Rejected</button></div></div>`);
    adminPanelV2.querySelector('#adminV2Connection').insertAdjacentHTML('afterend',`<button type="button" class="admin-v2-refresh" data-admin-v2-refresh>${workspaceIcon('rotate')} Refresh data</button>`);
    adminPanelV2.querySelector('[data-admin-v2-filter="status"]').insertAdjacentHTML('beforeend','<option value="avatar">Avatar awaiting review</option>');
}

function adminV2Users(){
    const viewer=workspaceUser(),search=adminV2.query.toLowerCase();
    const filtered=siteUsers.filter(user=>{if(validSupabaseConfig()&&!adminCloudIds.has(user.id))return false;const hay=`${user.username} ${user.displayName} ${user.bio} ${user.email}`.toLowerCase();if(search&&!hay.includes(search))return false;if(adminV2.role&&user.role!==adminV2.role)return false;if(adminV2.status==='online'&&!isOnlineNow(user.lastSeen))return false;if(adminV2.status==='banned'&&!user.banned)return false;if(adminV2.status==='active'&&!isRecentlyActive(user.lastSeen,7))return false;if(adminV2.status==='avatar'&&!user.pendingAvatar)return false;return true;}).sort((a,b)=>adminV2.sort==='name'?(a.displayName||a.username).localeCompare(b.displayName||b.username):adminV2.sort==='time'?(b.totalTimeSec||0)-(a.totalTimeSec||0):adminV2.sort==='recent'?new Date(b.lastSeen||0)-new Date(a.lastSeen||0):roleRank(b.role)-roleRank(a.role));
    const pages=Math.max(1,Math.ceil(filtered.length/adminV2.pageSize));adminV2.page=Math.min(adminV2.page,pages);const visible=filtered.slice((adminV2.page-1)*adminV2.pageSize,adminV2.page*adminV2.pageSize);const manageable=user=>!!viewer&&!viewer.banned&&AccountPolicy.canManage(viewer,user);
    return {viewer,filtered,visible,pages,manageable};
}
function adminV2UserCard(user,state){
    const can=state.manageable(user),selected=adminV2.selected.has(user.id),inspected=adminV2.inspect===user.id;
    return `<article class="admin-v2-user ${selected?'is-selected':''} ${inspected?'is-inspected':''} ${user.banned?'is-banned':''}" data-admin-v2-user="${esc(user.id)}"><div class="admin-v2-user-check">${can?`<input type="checkbox" data-admin-v2-select="${esc(user.id)}" ${selected?'checked':''} aria-label="Select ${esc(user.username)}">`:workspaceIcon('lock')}</div><div class="admin-v2-avatar"><img src="${esc(siteAvatarUrl(user))}" alt="" width="48" height="48" loading="lazy" data-avatar-fallback><i class="${isOnlineNow(user.lastSeen)?'online':''}"></i></div><div class="admin-v2-user-copy"><strong>${esc(user.displayName||user.username)}</strong><span>@${esc(user.username)} · ${esc(user.bio||'No bio yet')}</span><small>${workspaceIcon('clock')} ${formatDuration(user.totalTimeSec)} · ${workspaceIcon('cube')} ${(loadMcAccounts(user.id)||[]).length} profiles · ${user.banned?'Restricted':'Active'}</small></div><div class="admin-v2-user-action"><select data-admin-v2-role="${esc(user.id)}" aria-label="Role for ${esc(user.username)}" ${can?'':'disabled'}>${adminAllowedRoles(viewerForAdminV2(state.viewer)).map(key=>`<option value="${key}" ${key===user.role?'selected':''}>${esc(roleInfo(key).label)}</option>`).join('')}</select><button type="button" data-admin-v2-inspect="${esc(user.id)}">${workspaceIcon('arrow-right')}<span>Inspect</span></button></div></article>`;
}
function viewerForAdminV2(user){return user;}
function adminV2Inspector(user,state){
    if(!user)return `<div class="admin-v2-empty">${workspaceIcon('user-gear')}<strong>Select an account</strong><span>Inspect access and activity without leaving the list.</span></div>`;
    const can=state.manageable(user)&&user.id!==state.viewer.id;
    const id=esc(user.id);
    const action=(key,icon,label)=>`<button type="button" data-admin-v2-inspect-action="${key}" data-admin-v2-inspect-id="${id}">${workspaceIcon(icon)} ${label}</button>`;
    const pending=user.pendingAvatar?`<div class="admin-v2-pending"><small>AVATAR AWAITING REVIEW</small><img src="${esc(user.pendingAvatar)}" alt="Pending avatar for ${esc(user.username)}" width="96" height="96"></div>`:'';
    const controls=can?`<div class="admin-v2-inspector-actions">
        ${action('username','at','Change username')}
        ${action('display_name','id-card','Change display name')}
        ${user.pendingAvatar?`${action('avatar_approve','check','Approve avatar')}${action('avatar_reject','xmark','Reject avatar')}`:''}
        ${user.avatar?action('avatar_clear','trash-can','Remove avatar'):''}
        ${(!validSupabaseConfig()||/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(user.id))?action('password','key','Change password'):''}
        ${action(user.banned?'unban':'ban',user.banned?'unlock':'ban',user.banned?'Restore sign-in':'Restrict sign-in')}
        ${isDev(state.viewer)&&!validSupabaseConfig()?`<button type="button" data-admin-v2-inspect-action="delete" data-admin-v2-inspect-id="${id}" class="danger">${workspaceIcon('trash-can')} Delete local account</button>`:''}
    </div>`:'';
    return `<div class="admin-v2-inspector-top"><small>ACCOUNT DETAILS</small><h3>${esc(user.displayName||user.username)}</h3><span>${esc(roleInfo(user.role).label)} · ${user.banned?'Restricted':'Active'}</span></div><dl><div><dt>Username</dt><dd>@${esc(user.username)}</dd></div><div><dt>Joined</dt><dd>${esc(user.registeredAt||'—')}</dd></div><div><dt>Site time</dt><dd>${formatDuration(user.totalTimeSec)}</dd></div><div><dt>Account id</dt><dd><code>${id}</code></dd></div></dl>${pending}${controls}`;
}
function renderAdminV2Users(){
    const root=adminPanelV2,state=adminV2Users();if(!root)return;
    root.querySelector('[data-admin-v2-count]').textContent=`${state.filtered.length} account${state.filtered.length===1?'':'s'} · page ${adminV2.page}/${state.pages}`;
    root.querySelector('[data-admin-v2-list]').innerHTML=state.visible.length?state.visible.map(user=>adminV2UserCard(user,state)).join(''):`<div class="admin-v2-empty">${workspaceIcon(adminCloudError?'plug-circle-exclamation':'user-slash')}<strong>${esc(adminCloudError||'No accounts found')}</strong><span>${adminCloudError?'Use Refresh data after applying the administration migration.':'Clear a filter or try another name.'}</span></div>`;
    const inspected=state.filtered.find(user=>user.id===adminV2.inspect)||state.visible[0];root.querySelector('[data-admin-v2-inspector]').innerHTML=adminV2Inspector(inspected,state);
    root.querySelector('[data-admin-v2-pages]').innerHTML=`<button data-admin-v2-page="prev" ${adminV2.page===1?'disabled':''}>${workspaceIcon('arrow-left')} Previous</button><span>${adminV2.page} / ${state.pages}</span><button data-admin-v2-page="next" ${adminV2.page===state.pages?'disabled':''}>Next ${workspaceIcon('arrow-right')}</button>`;
    const bulk=root.querySelector('[data-admin-v2-bulk]'),selected=[...adminV2.selected].filter(id=>state.filtered.some(user=>user.id===id));adminV2.selected=new Set(selected);bulk.hidden=!selected.length;bulk.innerHTML=selected.length?`<strong>${selected.length} selected</strong><select data-admin-v2-bulk-role aria-label="Bulk role">${adminAllowedRoles(state.viewer).map(key=>`<option value="${key}">${esc(roleInfo(key).label)}</option>`).join('')}</select><button data-admin-v2-bulk-action="role">Apply role</button><button data-admin-v2-bulk-action="ban">Restrict</button><button data-admin-v2-bulk-action="unban">Restore</button><button data-admin-v2-bulk-action="export">Export</button>`:'';
}
function adminV2Review(action,ids,role){
    adminV2.forumPending=null;
    const viewer=workspaceUser(),targets=ids.map(id=>siteUsers.find(user=>user.id===id)).filter(Boolean);if(!targets.length||targets.some(user=>!AccountPolicy.canManage(viewer,user,action==='role'?role:null)))return showToast('This account is protected by the role hierarchy.','lock');
    adminV2.pending={action,role,actorId:viewer.id,targets:targets.map(user=>({id:user.id,username:user.username,role:user.role,banned:user.banned}))};
    const review=adminPanelV2.querySelector('[data-admin-v2-review]')||document.getElementById('adminV2Review');if(!review)return;
    const labels={role:'Change role',ban:'Restrict sign-in',unban:'Restore sign-in',delete:'Delete local account',password:'Change password',username:'Change username',display_name:'Change display name',avatar_approve:'Approve avatar',avatar_reject:'Reject avatar',avatar_clear:'Remove avatar'};
    if(!labels[action])return;
    const input=action==='password'?'<label>New password (12–128 characters)<input data-admin-v2-new-value type="password" minlength="12" maxlength="128" autocomplete="new-password" spellcheck="false"></label><label>Confirm new password<input data-admin-v2-confirm-value type="password" minlength="12" maxlength="128" autocomplete="new-password" spellcheck="false"></label>'
        :action==='username'||action==='display_name'?`<label>${action==='username'?'New username':'New display name'}<input data-admin-v2-new-value type="text" maxlength="${action==='username'?20:24}" value="${esc(action==='username'?targets[0].username:targets[0].displayName)}" autocomplete="off"></label>`:'';
    review.hidden=false;review.innerHTML=`<div class="admin-v2-review-head"><span>${workspaceIcon('code-compare')}</span><div><small>REVIEW BEFORE APPLYING</small><h3>${labels[action]}</h3></div></div><div class="admin-v2-diff">${targets.map(user=>`<div><strong>${esc(user.username)}</strong><span>${esc(action==='role'?roleInfo(user.role).label:user.banned?'Restricted':'Active')}</span>${workspaceIcon('arrow-right')}<b>${esc(action==='role'?roleInfo(role).label:action==='ban'?'Restricted':action==='unban'?'Active':action==='delete'?'Deleted':labels[action])}</b></div>`).join('')}</div>${input}<label>Why is this change needed?<input data-admin-v2-reason maxlength="160" placeholder="Short reason for the activity log"></label><p data-admin-v2-error></p><footer><button data-admin-v2-cancel>Cancel</button><button data-admin-v2-apply>${workspaceIcon('check')} Apply reviewed change</button></footer>`;
    review.scrollIntoView({behavior:REDUCED_MOTION?'auto':'smooth',block:'nearest'});
}
function adminV2CascadeDelete(ids){
    const idSet=new Set(ids),styles=loadProfileStyles(),previews=loadDevRolePreviews(),records=new Map();
    for(const id of idSet){records.set(K_MC_PFX+id,null);records.set(K_MC_ACT+id,null);delete styles[id];delete previews[id];}
    const nextFriends=friendships.filter(item=>!idSet.has(item.requester)&&!idSet.has(item.addressee));
    const nextForum=forumPosts.filter(post=>!idSet.has(post.authorId)).map(post=>({...post,upvotes:(post.upvotes||[]).filter(id=>!idSet.has(id))}));
    records.set(K_PROFILE_STYLES,styles);records.set(K_DEV_ROLE_PREVIEWS,previews);records.set(K_ROLE_ORDERS,loadRoleOrders().filter(order=>!idSet.has(order.userId)));records.set(K_FRIENDS,nextFriends);records.set(K_FORUM,nextForum);persistAdminRecords(records);
    friendships=nextFriends;forumPosts=nextForum;
}
async function adminV2ApplyIdentityChange(pending,reason,actor,target,review){
    const action=pending.action;
    const input=review.querySelector('[data-admin-v2-new-value]');
    const value=input?.value||'';
    if(action==='password'&&(value.length<12||value.length>128||!value.trim()))throw new Error('Use a password with 12–128 characters.');
    if(action==='password'&&review.querySelector('[data-admin-v2-confirm-value]')?.value!==value)throw new Error('The passwords do not match.');
    if(action==='username'&&(!/^[A-Za-z0-9 _.-]{3,20}$/.test(value)||AccountPolicy.nameIssue(value)))throw new Error(AccountPolicy.nameIssue(value)||'Use 3–20 letters, numbers, spaces or _ . - for the username.');
    if(action==='display_name'&&(!value.trim()||value.length>24||AccountPolicy.nameIssue(value)))throw new Error(AccountPolicy.nameIssue(value)||'Use a display name of 1–24 characters.');
    if(action==='avatar_approve'&&!target.pendingAvatar)throw new Error('The pending avatar is no longer available.');
    if(action==='avatar_reject'&&!target.pendingAvatar)throw new Error('The pending avatar is no longer available.');
    if(action==='password'){input.value='';review.querySelector('[data-admin-v2-confirm-value]').value='';}
    if(validSupabaseConfig()){
        if(!authAvailable()||!cloudAuthUserId)throw new Error('Reconnect to administration.');
        if(action==='password'){
            const {error}=await cloud.functions.invoke('admin-password',{body:{targetId:target.id,password:value,reason,expectedRole:target.role,expectedBanned:target.banned}});
            if(error)throw new Error('Password change was rejected. Refresh the account and audit history before retrying.');
        }else{
            const {error}=await cloud.rpc('spectral_admin_moderate_profile',{p_target_id:target.id,p_action:action,p_value:action==='username'||action==='display_name'?value:null,p_reason:reason});
            if(error)throw new Error('Server rejected the moderation change. Refresh the account and try again.');
        }
        await loadAdminCloud();
    }else{
        const updated={...target};
        let before='',after='';
        if(action==='password'){updated.password=await hashPassword(value);before='Unchanged';after='Changed';}
        if(action==='username'){
            if(siteUsers.some(user=>user.id!==target.id&&user.username.toLowerCase()===value.trim().toLowerCase()))throw new Error('This username is already taken.');
            before=target.username;after=value.trim();updated.username=after;
        }
        if(action==='display_name'){before=target.displayName;after=value.trim();updated.displayName=after;}
        if(action==='avatar_approve'){before='Pending';after='Approved';updated.avatar=target.pendingAvatar;updated.pendingAvatar='';}
        if(action==='avatar_reject'){before='Pending';after='Rejected';updated.pendingAvatar='';}
        if(action==='avatar_clear'){before='Visible';after='Removed';updated.avatar='';updated.pendingAvatar='';}
        const next=siteUsers.map(user=>user.id===target.id?updated:user);
        const audit=readJsonStorage(K_ADMIN_AUDIT,[],Array.isArray);
        audit.push({id:crypto.randomUUID(),actorId:actor.id,actorName:actor.username,action,reason,createdAt:new Date().toISOString(),changes:[{id:target.id,username:target.username,before,after}]});
        persistAdminRecords(new Map([[K_USERS,next],[K_ADMIN_AUDIT,audit.slice(-200)]]));
        siteUsers=next;
    }
    adminV2.pending=null;adminV2.selected.clear();renderAdminV2();showToast('Reviewed account change saved.','check');
}
async function adminV2Apply(){
    if(adminV2.forumPending){
        const pending=adminV2.forumPending,review=adminPanelV2.querySelector('#adminV2Review'),reason=review?.querySelector('[data-admin-v2-reason]')?.value.trim();
        if(!reason||reason.length<3){review.querySelector('[data-admin-v2-error]').textContent='Add a short reason before applying.';return;}
        if(adminV2.busy)return;adminV2.busy=true;
        try{
            if(validSupabaseConfig())await moderateCommunityIdea(pending.id,pending.action,reason);
            else{const post=forumPosts.find(item=>item.id===pending.id);if(!post)throw new Error('The idea changed. Refresh the queue.');post.approved=pending.action==='approve';post.rejected=!post.approved;saveForum(forumPosts);renderForum();const actor=workspaceUser(),audit=readJsonStorage(K_ADMIN_AUDIT,[],Array.isArray);audit.push({id:crypto.randomUUID(),actorId:actor.id,actorName:actor.username,action:`idea_${pending.action}`,reason,createdAt:new Date().toISOString(),changes:[{id:post.id,username:post.title,before:'Idea',after:pending.action}]});try{localStorage.setItem(K_ADMIN_AUDIT,JSON.stringify(audit.slice(-200)));}catch{}}
            adminV2.forumPending=null;review.hidden=true;renderAdminV2();showToast('Idea review saved.','check');
        }catch(error){review.querySelector('[data-admin-v2-error]').textContent=error.message||'Could not save the review.';}
        finally{adminV2.busy=false;}
        return;
    }
    const pending=adminV2.pending,review=adminPanelV2.querySelector('#adminV2Review'),reason=review?.querySelector('[data-admin-v2-reason]')?.value.trim();if(!pending||!reason||reason.length<3)return review?.querySelector('[data-admin-v2-error]').replaceChildren(document.createTextNode('Add a short reason before applying.'));
    if(adminV2.busy)return;adminV2.busy=true;
    const actor=siteUsers.find(user=>user.id===pending.actorId),targets=pending.targets.map(before=>siteUsers.find(user=>user.id===before.id));
    try{
        if(!actor||targets.some((user,index)=>!user||!AccountPolicy.canManage(actor,user,pending.action==='role'?pending.role:null)||user.role!==pending.targets[index].role||user.banned!==pending.targets[index].banned))throw new Error('The account changed. Review the latest state.');
        if(['password','username','display_name','avatar_approve','avatar_reject','avatar_clear'].includes(pending.action)){
            if(targets.length!==1)throw new Error('Select one account for this change.');
            await adminV2ApplyIdentityChange(pending,reason,actor,targets[0],review);
            return;
        }
        if(validSupabaseConfig()){
            if(!authAvailable()||!cloudAuthUserId)throw new Error('Reconnect to administration before applying changes.');
            const {error}=await cloud.rpc('spectral_admin_apply',{p_targets:pending.targets,p_action:pending.action,p_role:pending.role||null,p_reason:reason});
            if(error)throw new Error('Server rejected the change. Refresh the directory and review your permissions.');
            await loadAdminCloud();adminV2.pending=null;adminV2.selected.clear();renderAdminV2();showToast('Reviewed admin change saved.','check');return;
        }
        const ids=new Set(targets.map(user=>user.id)),next=siteUsers.filter(user=>pending.action!=='delete'||!ids.has(user.id)).map(user=>ids.has(user.id)&&pending.action==='role'?{...user,role:pending.role,roleSource:'admin'}:ids.has(user.id)?{...user,banned:pending.action==='ban'}:user);
        if(!saveSiteUsers(next))throw new Error('Browser storage is full.');siteUsers=next;
        if(pending.action==='delete')adminV2CascadeDelete(ids);
        const audit=readJsonStorage(K_ADMIN_AUDIT,[],Array.isArray);audit.push({id:crypto.randomUUID(),actorId:actor.id,actorName:actor.username,action:pending.action,reason,createdAt:new Date().toISOString(),changes:targets.map(user=>({id:user.id,username:user.username,before:pending.action==='role'?user.role:user.banned?'Restricted':'Active',after:pending.action==='role'?pending.role:pending.action==='ban'?'Restricted':pending.action==='unban'?'Active':'Deleted'}))});try{localStorage.setItem(K_ADMIN_AUDIT,JSON.stringify(audit.slice(-200)));}catch{}
        adminV2.pending=null;adminV2.selected.clear();renderAdminV2();showToast('Reviewed admin change saved.','check');
    }catch(error){const message=review?.querySelector('[data-admin-v2-error]');if(message)message.textContent=error.message;}finally{adminV2.busy=false;}
}
function renderAdminV2(){
    const user=workspaceUser();if(!user||!adminPanelV2)return;const accounts=validSupabaseConfig()?siteUsers.filter(item=>adminCloudIds.has(item.id)):siteUsers;const metrics=adminPanelV2.querySelector('[data-admin-v2-metrics]')||document.getElementById('adminV2Metrics');if(metrics)metrics.innerHTML=[['users',validSupabaseConfig()?'Loaded accounts':'Accounts',accounts.length],['bolt','Active 7d',accounts.filter(item=>isRecentlyActive(item.lastSeen,7)).length],['inbox','Pending',forumPosts.filter(item=>!item.approved&&!item.rejected).length],['user-slash','Restricted',accounts.filter(item=>item.banned).length]].map(([icon,label,value])=>`<div>${workspaceIcon(icon)}<span><b>${value}</b><small>${label}</small></span></div>`).join('');
    const review=adminPanelV2.querySelector('#adminV2Review');if(review&&!adminV2.pending&&!adminV2.forumPending)review.hidden=true;
    adminPanelV2.querySelectorAll('[data-admin-v2-tab]').forEach(tab=>{const active=tab.dataset.adminV2Tab===adminV2.tab;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    adminPanelV2.querySelectorAll('[data-admin-v2-view]').forEach(view=>{view.hidden=view.dataset.adminV2View!==adminV2.tab;});
    const connection=adminPanelV2.querySelector('[data-admin-v2-connection]')||document.getElementById('adminV2Connection');if(connection)connection.innerHTML=`${workspaceIcon(validSupabaseConfig()?'cloud':'hard-drive')} ${validSupabaseConfig()?(adminV2.loading?'Syncing…':adminCloudConnected?'Database connected':esc(adminCloudError||'Database disconnected')):'Local demo mode'}`;
    if(adminV2.tab==='users')renderAdminV2Users();
    if(adminV2.tab==='activity'){const list=adminPanelV2.querySelector('[data-admin-v2-audit]');const rows=[...adminAuditEntries(),...(validSupabaseConfig()?communityRemoteAudit:[])].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));list.innerHTML=rows.length?rows.map(entry=>`<article>${workspaceIcon(entry.action==='role'?'id-badge':entry.action==='ban'?'ban':entry.action?.startsWith('idea_')?'comment-dots':'unlock')}<div><strong>${esc(entry.actorName||'Staff')} · ${esc(entry.action)}</strong><time>${esc(new Date(entry.createdAt).toLocaleString())}</time><p>${esc(entry.reason||'No reason recorded')}</p><small>${(entry.changes||[]).map(change=>`${esc(change.username||change.id)}: ${esc(change.before)} → ${esc(change.after)}`).join(' · ')}</small></div></article>`).join(''):`<div class="admin-v2-empty">${workspaceIcon('clock-rotate-left')}<strong>No reviewed changes yet</strong></div>`;}
    if(adminV2.tab==='forum')renderAdminV2Forum();
    if(adminV2.tab==='analytics'){const list=adminPanelV2.querySelector('[data-admin-v2-analytics]');const counts=ROLE_ORDER.map(key=>({key,count:accounts.filter(item=>item.role===key).length})).filter(item=>item.count);const totalTime=accounts.reduce((sum,item)=>sum+(item.totalTimeSec||0),0);list.innerHTML=`<div class="admin-v2-analytics-grid"><article><strong>${accounts.length}</strong><span>Accounts in directory</span></article><article><strong>${totalTime?formatDuration(totalTime):'0m'}</strong><span>Total site time</span></article><article><strong>${forumPosts.filter(item=>item.approved).length}</strong><span>Published ideas</span></article><article><strong>${forumPosts.filter(item=>!item.approved&&!item.rejected).length}</strong><span>Awaiting review</span></article></div><div class="admin-v2-role-bars">${counts.map(item=>`<div><span>${esc(roleInfo(item.key).label)}</span><b>${item.count}</b><i style="width:${Math.min(100,item.count/Math.max(1,accounts.length)*100)}%"></i></div>`).join('')}</div>`;}
}

function selectAdminWorkspaceTab(target){
    const order=['users','forum','activity','analytics'];
    if(!order.includes(target))return;
    if(target===adminV2.tab)return;
    const previous=adminV2.tab;
    adminV2.tab=target;adminV2.page=1;adminV2.pending=null;adminV2.forumPending=null;
    const outgoing=adminPanelV2?.querySelector(`[data-admin-v2-view="${previous}"]`);
    interruptWorkspaceMotion(outgoing);
    renderAdminV2();
    revealWorkspaceContent(adminPanelV2?.querySelector(`[data-admin-v2-view="${target}"]`),order.indexOf(target)>order.indexOf(previous)?1:-1,{distance:10,duration:300});
}

function requestAdminWorkspaceTab(target){
    clearTimeout(adminSwitchTimer);
    if(target===adminV2.tab)return;
    selectAdminWorkspaceTab(target);
}

function renderAdminV2Forum(){
    const list=adminPanelV2.querySelector('[data-admin-v2-forum]');if(!list)return;
    const state=post=>post.rejected?'rejected':post.approved?'approved':'pending';
    const query=adminV2.forumQuery.trim().toLowerCase();
    const posts=forumPosts.filter(post=>(adminV2.forumFilter==='all'||state(post)===adminV2.forumFilter)&&(!query||`${post.title||''} ${post.text||''} ${post.authorName||''}`.toLowerCase().includes(query))).slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    adminPanelV2.querySelector('[data-admin-v2-forum-count]').textContent=`${posts.length} of ${forumPosts.length} ideas`;
    adminPanelV2.querySelectorAll('[data-admin-v2-forum-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.adminV2ForumFilter===adminV2.forumFilter)));
    list.innerHTML=posts.length?posts.map(post=>`<article><span>${workspaceIcon(post.rejected?'xmark':post.approved?'check':'clock')}</span><div><strong>${esc(post.title||'Untitled idea')}</strong><small>${esc(post.authorName||'Unknown')} · ${esc(post.date||'')}</small><p>${esc(post.text||'')}</p><div class="admin-v2-forum-actions">${!post.approved?`<button type="button" data-admin-v2-forum-action="approve" data-post-id="${esc(post.id)}">${workspaceIcon('check')} Approve</button>`:''}${!post.rejected?`<button type="button" data-admin-v2-forum-action="reject" data-post-id="${esc(post.id)}">${workspaceIcon('xmark')} Reject</button>`:''}</div></div><em>${state(post)}</em></article>`).join(''):`<div class="admin-v2-empty">${workspaceIcon('inbox')}<strong>${esc(communityCloudError||'No matching ideas')}</strong><span>${communityCloudError?'Refresh after checking the community migration.':'Try another filter or search.'}</span></div>`;
}

async function refreshAdminV2Cloud(){
    if(!validSupabaseConfig()){
        siteUsers=loadSiteUsers()||siteUsers;
        forumPosts=loadForum()||forumPosts;
        renderAdminV2();showToast('Local data refreshed.','rotate');return;
    }
    if(adminV2.loading)return;
    adminV2.loading=true;renderAdminV2();
    try{await Promise.all([loadAdminCloud(),loadCommunityCloud(),loadCommunityAudit()]);}
    finally{adminV2.loading=false;renderAdminV2();}
}

function bindAdminV2(){
    if(!adminPanelV2)return;adminV2Template();
    adminPanelV2.addEventListener('click',event=>{
        if(event.target.closest('[data-admin-v2-refresh]')){refreshAdminV2Cloud();return;}
        const tab=event.target.closest('[data-admin-v2-tab]');if(tab){requestAdminWorkspaceTab(tab.dataset.adminV2Tab);return;}
        const forumFilter=event.target.closest('[data-admin-v2-forum-filter]');if(forumFilter){adminV2.forumFilter=forumFilter.dataset.adminV2ForumFilter;renderAdminV2Forum();return;}
        const forumAction=event.target.closest('[data-admin-v2-forum-action]');if(forumAction){
            const viewer=workspaceUser(),post=forumPosts.find(item=>String(item.id)===forumAction.dataset.postId);
            if(!post||!canModerate(viewer))return;
            adminV2.forumPending={id:post.id,action:forumAction.dataset.adminV2ForumAction};
            const review=adminPanelV2.querySelector('#adminV2Review');review.hidden=false;
            review.innerHTML=`<div class="admin-v2-review-head"><span>${workspaceIcon('comment-dots')}</span><div><small>COMMUNITY REVIEW</small><h3>${adminV2.forumPending.action==='approve'?'Approve':'Reject'} idea</h3></div></div><div class="admin-v2-diff"><div><strong>${esc(post.title)}</strong><span>${esc(post.authorName)}</span>${workspaceIcon('arrow-right')}<b>${adminV2.forumPending.action}</b></div></div><label>Reason for this decision<input data-admin-v2-reason maxlength="160" placeholder="Short reason for the activity log"></label><p data-admin-v2-error></p><footer><button data-admin-v2-cancel>Cancel</button><button data-admin-v2-apply>${workspaceIcon('check')} Save review</button></footer>`;
            review.scrollIntoView({behavior:REDUCED_MOTION?'auto':'smooth',block:'nearest'});review.querySelector('input')?.focus({preventScroll:true});return;
        }
        const inspect=event.target.closest('[data-admin-v2-inspect]');if(inspect){adminV2.inspect=inspect.dataset.adminV2Inspect;renderAdminV2Users();return;}
        const page=event.target.closest('[data-admin-v2-page]');if(page&&!page.disabled){adminV2.page+=page.dataset.adminV2Page==='next'?1:-1;renderAdminV2Users();return;}
        const clear=event.target.closest('[data-admin-v2-clear]');if(clear){adminV2.selected.clear();renderAdminV2Users();return;}
        const bulk=event.target.closest('[data-admin-v2-bulk-action]');if(bulk){const ids=[...adminV2.selected];if(bulk.dataset.adminV2BulkAction==='export')return exportAdminUsers(ids.map(id=>siteUsers.find(user=>user.id===id)).filter(Boolean),'selected-users');adminV2Review(bulk.dataset.adminV2BulkAction,ids,adminPanelV2.querySelector('[data-admin-v2-bulk-role]')?.value);return;}
        const inspectAction=event.target.closest('[data-admin-v2-inspect-action]');if(inspectAction){adminV2Review(inspectAction.dataset.adminV2InspectAction,[inspectAction.dataset.adminV2InspectId]);return;}
        if(event.target.closest('[data-admin-v2-cancel]')){adminV2.pending=null;adminV2.forumPending=null;adminPanelV2.querySelector('#adminV2Review').hidden=true;return;}
        if(event.target.closest('[data-admin-v2-apply]'))adminV2Apply();
    });
    adminPanelV2.addEventListener('input',event=>{if(event.target.matches('[data-admin-v2-search]')){adminV2.query=event.target.value;adminV2.page=1;renderAdminV2Users();}if(event.target.matches('[data-admin-v2-forum-search]')){adminV2.forumQuery=event.target.value;renderAdminV2Forum();}});
    adminPanelV2.addEventListener('change',event=>{
        if(event.target.matches('[data-admin-v2-filter]')){adminV2[event.target.dataset.adminV2Filter]=event.target.value;adminV2.page=1;adminV2.selected.clear();renderAdminV2Users();return;}
        if(event.target.matches('[data-admin-v2-select]')){event.target.checked?adminV2.selected.add(event.target.dataset.adminV2Select):adminV2.selected.delete(event.target.dataset.adminV2Select);renderAdminV2Users();return;}
        if(event.target.matches('[data-admin-v2-select-all]')){const state=adminV2Users();state.visible.filter(state.manageable).forEach(user=>event.target.checked?adminV2.selected.add(user.id):adminV2.selected.delete(user.id));renderAdminV2Users();return;}
        if(event.target.matches('[data-admin-v2-role]'))adminV2Review('role',[event.target.dataset.adminV2Role],event.target.value);
    });
    adminPanelV2.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();adminPanelV2.querySelector('[data-admin-v2-search]')?.focus();}});
}

function activateProfileTabV2(target){
    if(target==='admin-panel'&&!canAccessAdmin(workspaceUser()))return;
    const selected=profileTabsV2?.querySelector(`[data-ptab="${target}"]:not([hidden])`);if(!selected)return;
    const tabs=[...profileTabsV2.querySelectorAll('.profile-tab')],panels=[...document.querySelectorAll('#profileView > .ptab-content')],previousTab=tabs.find(tab=>tab.classList.contains('active')),previousPanel=panels.find(panel=>panel.dataset.ptabContent===previousTab?.dataset.ptab)||panels.find(panel=>!panel.hidden),nextPanel=panels.find(panel=>panel.dataset.ptabContent===target);
    if(!nextPanel)return;
    const previousIndex=tabs.indexOf(previousTab),nextIndex=tabs.indexOf(selected);
    const changed=previousPanel!==nextPanel||panels.some(panel=>panel.hidden===(panel===nextPanel))||previousTab!==selected;
    panels.forEach(interruptWorkspaceMotion);
    profileTabsV2.querySelectorAll('.profile-tab').forEach(tab=>{const active=tab===selected;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    const modal=dashOverlay?.querySelector('.dashboard-modal');
    panels.forEach(panel=>{const active=panel===nextPanel;panel.hidden=!active;if(active)panel.style.removeProperty('display');else panel.style.display='none';panel.classList.toggle('active',active);panel.classList.remove('ptab-enter');panel.setAttribute('aria-hidden',String(!active));});
    const mode=target==='admin-panel'?'admin':target==='role-store'?'store':false;setDashboardWide(mode);if(modal)modal.dataset.workspace=target;
    if(modal)modal.scrollTop=0;
    if(target==='my-profile'){
        const user=workspaceUser();
        if(user)loadProfileViewData(user,{resetTab:false});
    }
    renderAccountStudio();
    profileTabsV2.style.setProperty('--tab-index',String(nextIndex));
    if(target==='role-store'){renderRoleWorkspaceV2();}
    if(target==='admin-panel'){renderAdminV2();if(validSupabaseConfig()&&!adminCloudConnected)refreshAdminV2Cloud();}
    if(changed&&dashOverlay?.classList.contains('open')){
        const direction=nextIndex>previousIndex?1:-1;
        revealWorkspaceContent(nextPanel,direction,{distance:12,duration:340});
        revealWorkspaceContent(document.querySelector('.account-hub-title'),direction,{distance:5,duration:260});
    }
}
function requestProfileTabV2(target){
    clearTimeout(profileSwitchTimer);
    const current=document.querySelector('#profileView > .ptab-content:not([hidden])');
    if(current?.dataset.ptabContent===target)return;
    activateProfileTabV2(target);
}
function openRoleStoreV2(){if(!currentUserId){openDashboard();return;}if(!dashOverlay?.classList.contains('open'))openDashboard();activateProfileTabV2('role-store');}
globalThis.activateProfileTab=activateProfileTabV2;
globalThis.openRoleStore=openRoleStoreV2;
globalThis.renderRoleStore=renderRoleWorkspaceV2;
globalThis.renderAdminPanel=renderAdminV2;
globalThis.renderAdminUsers=renderAdminV2Users;
globalThis.renderAdminStats=renderAdminV2;
globalThis.renderAdminForum=renderAdminV2;
globalThis.openAdminSection=target=>selectAdminWorkspaceTab(target==='site-stats'?'analytics':target);
globalThis.refreshAdmin=renderAdminV2;
globalThis.updateAdminOverview=renderAdminV2;

bindRolesV2();bindAdminV2();
profileTabsV2?.addEventListener('click',event=>{const tab=event.target.closest('[data-ptab]');if(tab)requestProfileTabV2(tab.dataset.ptab);});
profileTabsV2?.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;const tabs=[...profileTabsV2.querySelectorAll('.profile-tab:not([hidden])')],index=tabs.indexOf(document.activeElement);if(index<0)return;event.preventDefault();const next=tabs[(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];next.focus();requestProfileTabV2(next.dataset.ptab);});
// Account hub is a view layer over the existing account and role model.
const ACCOUNT_HUB_COPY={
    'my-profile':['Your profile','Shape the identity other players see.'],
    'role-store':['Roles & plans','Compare the collection and save a launch plan.'],
    'admin-panel':['Admin center','Review people, community ideas and activity.']
};

function renderAccountStudio(){
    const user=currentRoleUser();if(!user)return;
    const draft=profileDraftFor(user);
    const active=profileTabsV2?.querySelector('.profile-tab.active')?.dataset.ptab||'my-profile';
    const [title,subtitle]=ACCOUNT_HUB_COPY[active]||ACCOUNT_HUB_COPY['my-profile'];
    const text=(id,value)=>{const element=document.getElementById(id);if(element)element.textContent=value;};
    text('accountHubTitle',title);
    text('accountHubSubtitle',subtitle);
    text('accountHubName',user.displayName||user.username);
    text('accountHubRole',roleInfo(user.role).label);
    text('accountHubMode',validSupabaseConfig()?'Connected account':'Local demo');
    text('accountRailHint',profileIsDirty(user)?'Your profile has unsaved changes.':'Profile changes are saved when you press Save.');
    text('accountPreviewName',draft.displayName.trim()||user.username);
    text('accountPreviewStatus',draft.status.trim()||'Your status appears here');
    const hubAvatar=document.getElementById('accountHubAvatar');
    if(hubAvatar)hubAvatar.src=siteAvatarUrl(user);
    const previewAvatar=document.getElementById('accountPreviewAvatar');
    if(previewAvatar)previewAvatar.src=draft.avatar||siteAvatarUrl({...user,avatar:''});
    document.querySelectorAll('[data-account-status]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.accountStatus===draft.status)));
}

document.querySelector('.account-status-presets')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-account-status]');
    const user=currentRoleUser(),input=document.getElementById('profileStatus');
    if(!button||!user||!input)return;
    input.value=button.dataset.accountStatus;
    profileDraftFor(user).status=input.value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
});
document.getElementById('closeAccountHubBtn')?.addEventListener('click',closeDashboard);
/* Server-backed ideas. Local sample posts stay confined to demo mode. */
let communityCloudError='';
let communityRequest=0;
if(validSupabaseConfig())forumPosts=[];
async function loadCommunityCloud(){
    if(!validSupabaseConfig()||!cloud)return false;
    const request=++communityRequest;
    try{
        const {data,error}=await cloud.rpc('spectral_ideas_feed');
        if(error)throw error;
        if(request!==communityRequest)return false;
        forumPosts=(Array.isArray(data)?data:[]).map(normalizeForumPost).filter(Boolean);
        communityCloudError='';
        renderForum();
        if(typeof renderAdminV2==='function'&&adminV2.tab==='forum')renderAdminV2Forum();
        return true;
    }catch(error){
        if(request!==communityRequest)return false;
        forumPosts=[];
        communityCloudError='Community data is unavailable. Apply the community administration migration or retry the connection.';
        console.warn('[community] feed failed:',error.message||error);
        renderForum();
        return false;
    }
}
async function submitCommunityIdea(title,body){
    if(!authAvailable()||!cloudAuthUserId)throw new Error('Sign in to submit an idea.');
    const {data,error}=await cloud.functions.invoke('moderate-content',{body:{kind:'idea',title,body}});
    if(error||!['approved','rejected'].includes(data?.decision))throw new Error('Automatic review is unavailable. Please try again later.');
    await loadCommunityCloud();
    return data.decision;
}
async function voteCommunityIdea(id){
    if(!authAvailable()||!cloudAuthUserId)throw new Error('Sign in to vote.');
    const {error}=await cloud.rpc('spectral_idea_vote',{p_idea_id:id});
    if(error)throw new Error(error.message||'Could not save your vote.');
    await loadCommunityCloud();
}
async function moderateCommunityIdea(id,action,reason){
    if(!authAvailable()||!cloudAuthUserId)throw new Error('Reconnect to moderation.');
    const {error}=await cloud.rpc('spectral_idea_moderate',{p_idea_id:id,p_action:action,p_reason:reason});
    if(error)throw new Error(error.message||'The server rejected this review.');
    await loadCommunityCloud();
    await loadCommunityAudit();
}
let communityRemoteAudit=[];
async function loadCommunityAudit(){
    if(!validSupabaseConfig()||!authAvailable()||!canModerate(workspaceUser()))return;
    const {data,error}=await cloud.rpc('spectral_idea_audit_feed');
    if(error){console.warn('[community] audit failed:',error.message||error);return;}
    communityRemoteAudit=Array.isArray(data)?data:[];
    if(typeof renderAdminV2==='function'&&adminV2.tab==='activity')renderAdminV2();
}
// ══════════════════════════════════════════════════════════════
// ADD MC ACCOUNT MODAL
// ══════════════════════════════════════════════════════════════
const addAccOverlay = document.getElementById('addAccountOverlay');
// The accounts <section> has a CSS transform, which would trap this position:fixed
// overlay inside it. Re-parent to <body> so it centres against the viewport.
if (addAccOverlay && addAccOverlay.parentElement !== document.body) document.body.appendChild(addAccOverlay);
const openAddBtn    = document.getElementById('openAddAccountBtn');
const closeAddBtn   = document.getElementById('closeAddAccountBtn');
let pendingAccountTimer = 0;
function resetPendingAccountAction(){
    if(pendingAccountTimer)clearTimeout(pendingAccountTimer);
    pendingAccountTimer=0;
    ['btnElybySubmit','btnOfflineSubmit'].forEach(id=>{const button=document.getElementById(id);if(!button)return;button.disabled=false;if(button.dataset.originalHtml){button.innerHTML=button.dataset.originalHtml;delete button.dataset.originalHtml;}});
}

function openAddAccount() {
    if (!currentUserId) { openDashboard(); return; }
    const user=currentRoleUser();
    const limit=roleProfileLimit(user?.role||'USER');
    if(Number.isFinite(limit)&&mcAccounts.length>=limit){showToast(`All ${limit} ${roleInfo(user?.role).label} profile slots are in use.`,'users-rectangle');openRoleStore();return;}
    if (!addAccOverlay) return;
    addAccOverlay.classList.add('open'); document.body.style.overflow='hidden';
    switchAccType('elyby');
    document.querySelectorAll('.acc-type-card').forEach(c=>c.classList.toggle('active',c.dataset.type==='elyby'));
    ['elybyLogin','offlineUsername'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
}
function closeAddAccount() {
    if (!addAccOverlay) return;
    resetPendingAccountAction();
    addAccOverlay.classList.remove('open'); syncBodyScrollLock();
}
function switchAccType(type) {
    ['elyby','offline'].forEach(t=>{const el=document.getElementById('form'+t.charAt(0).toUpperCase()+t.slice(1));if(el)el.style.display=t===type?'block':'none';});
}
if(openAddBtn)openAddBtn.addEventListener('click',openAddAccount);
document.getElementById('accountsEmptyAddBtn')?.addEventListener('click',openAddAccount);
if(closeAddBtn)closeAddBtn.addEventListener('click',closeAddAccount);
if(addAccOverlay)addAccOverlay.addEventListener('click',e=>{if(e.target===addAccOverlay)closeAddAccount();});

document.querySelectorAll('.acc-type-card').forEach(card=>{card.addEventListener('click',()=>{document.querySelectorAll('.acc-type-card').forEach(c=>c.classList.remove('active'));card.classList.add('active');switchAccType(card.dataset.type);});});

const btnElyby=document.getElementById('btnElybySubmit');
if(btnElyby){btnElyby.addEventListener('click',async()=>{if(pendingAccountTimer)return;const l=document.getElementById('elybyLogin');const login=sanitizeField(l?l.value:'',32);if(!login){if(l)l.focus();return;}btnElyby.dataset.originalHtml=btnElyby.innerHTML;btnElyby.disabled=true;btnElyby.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Saving profile...';pendingAccountTimer=-1;try{if(await addMcAccount(login,'elyby'))closeAddAccount();}finally{resetPendingAccountAction();}});}

const btnOffline=document.getElementById('btnOfflineSubmit');
if(btnOffline){btnOffline.addEventListener('click',async()=>{if(pendingAccountTimer)return;const u=document.getElementById('offlineUsername');const user=sanitizeField(u?u.value:'',32);if(!user||user.length<3){if(u)u.focus();return;}btnOffline.dataset.originalHtml=btnOffline.innerHTML;btnOffline.disabled=true;btnOffline.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Saving profile...';pendingAccountTimer=-1;try{if(await addMcAccount(user,'offline'))closeAddAccount();}finally{resetPendingAccountAction();}});}

// ══════════════════════════════════════════════════════════════
// CONFIRM MODAL
// ══════════════════════════════════════════════════════════════
const confirmOverlay=document.getElementById('confirmOverlay');
let confirmCb=null;
function showConfirm(text,cb){const el=document.getElementById('confirmText');if(el)el.textContent=text;confirmCb=cb;if(confirmOverlay){confirmOverlay.classList.add('open');document.body.style.overflow='hidden';}}
function hideConfirm(){if(confirmOverlay){confirmOverlay.classList.remove('open');syncBodyScrollLock();}}
document.getElementById('confirmCancel')&&document.getElementById('confirmCancel').addEventListener('click',()=>{hideConfirm();confirmCb=null;});
const confirmDelBtn=document.getElementById('confirmDeleteBtn');
if(confirmDelBtn){confirmDelBtn.addEventListener('click',()=>{if(confirmCb){const cb=confirmCb;confirmCb=null;hideConfirm();cb();}else hideConfirm();});}
if(confirmOverlay)confirmOverlay.addEventListener('click',e=>{if(e.target===confirmOverlay){hideConfirm();confirmCb=null;}});

// ══════════════════════════════════════════════════════════════
// NEWS SYSTEM (DEV editable)
// ══════════════════════════════════════════════════════════════
function renderDevWriteBtn() {
    const btn=document.getElementById('devWriteNewsBtn');if(!btn)return;
    const user=siteUsers.find(u=>u.id===currentUserId);
    btn.style.display=(user&&user.role==='DEV')?'inline-flex':'none';
}

// News editor modal
const newsEditorOverlay=document.getElementById('newsEditorOverlay');

document.getElementById('devWriteNewsBtn')&&document.getElementById('devWriteNewsBtn').addEventListener('click',openNewsEditor);
document.getElementById('closeNewsEditorBtn')&&document.getElementById('closeNewsEditorBtn').addEventListener('click',closeNewsEditor);
if(newsEditorOverlay)newsEditorOverlay.addEventListener('click',e=>{if(e.target===newsEditorOverlay)closeNewsEditor();});

// ══════════════════════════════════════════════════════════════
// FORUM
// ══════════════════════════════════════════════════════════════
// News system v2: filtering, rich release cards and a local-first editor.
const NEWS_DRAFT_KEY = 'spectral_news_draft_v2';
const NEWS_TYPES = {
    add: { label:'Added', icon:'plus' },
    imp: { label:'Improved', icon:'arrow-up' },
    fix: { label:'Fixed', icon:'wrench' },
    breaking: { label:'Important', icon:'triangle-exclamation' },
    security: { label:'Security', icon:'shield-halved' }
};
const NEWS_ICONS = new Set(['bolt','puzzle-piece','robot','gauge-high','language','terminal','palette','globe','cubes','shield-halved','wand-magic-sparkles','code-branch']);
let newsViewState = { query:'', filter:'all' };
let editingNewsId = null;
let newsDraftTimer = 0;
let lastNewsTimelineKey = null;

function validNewsType(type) { return Object.prototype.hasOwnProperty.call(NEWS_TYPES,type) ? type : 'add'; }
function validNewsIcon(icon) { return NEWS_ICONS.has(icon) ? icon : 'bolt'; }
function formatNewsText(value) {
    let safe = esc(value || '');
    safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
    return safe.replace(/\n/g, '<br>');
}
function releaseToMarkdown(item) {
    const localize=value=>window.SpectralI18n?.getLanguage()==='ru'?window.SpectralI18n.translate(value||''):value||'';
    const channel = item.channel ? ` · ${localize(item.channel)}` : '';
    const version = item.version ? ` ${item.version}` : '';
    const summary = item.summary ? `\n\n${localize(item.summary)}` : '';
    const lines = (item.items || []).map(change => {
        const meta = NEWS_TYPES[validNewsType(change.type)];
        return `- **${localize(meta.label)}:** ${localize(change.text)}`;
    }).join('\n');
    return `## ${localize(item.title)}${version}\n\n_${localize(item.date)}${channel}_${summary}\n\n${lines}`.trim();
}
function copyLocalText(text, successMessage) {
    const done=()=>showToast(successMessage || 'Copied to clipboard','copy');
    if(navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(()=>{});
    else {
        const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px;top:0';
        document.body.appendChild(area);area.select();try{document.execCommand('copy');done();}catch{}area.remove();
    }
}
function releaseCardMarkup(item, isDev, preview) {
    const items = Array.isArray(item.items) ? item.items : [];
    const counts = items.reduce((all,change)=>{const type=validNewsType(change.type);all[type]=(all[type]||0)+1;return all;},{});
    const channel = ['stable','beta','dev','website'].includes(item.channel) ? item.channel : 'stable';
    const releaseIcon = validNewsIcon(item.icon);
    const version = item.version || (item.isCurrent ? 'Latest' : 'Release');
    const summary = item.summary || (items[0] ? items[0].text.replace(/[*`\[\]()]/g,'').slice(0,170) : 'Release notes and product changes.');
    const list = items.map(change=>`<li class="${validNewsType(change.type)}">${formatNewsText(change.text)}</li>`).join('');
    const typeSummary = ['add','imp','fix'].filter(type=>counts[type]).map(type=>`<span><i class="fas fa-${NEWS_TYPES[type].icon} ${type}"></i>${counts[type]} ${NEWS_TYPES[type].label.toLowerCase()}</span>`).join('');
    const devActions = isDev && !preview ? `
        <button type="button" class="release-action" data-release-action="pin" title="Mark as current" aria-label="Mark as current release"><i class="fas fa-thumbtack"></i></button>
        <button type="button" class="release-action" data-release-action="edit" title="Edit update" aria-label="Edit update"><i class="fas fa-pen"></i></button>
        <button type="button" class="release-action" data-release-action="duplicate" title="Duplicate update" aria-label="Duplicate update"><i class="fas fa-clone"></i></button>
        <button type="button" class="release-action danger" data-release-action="delete" title="Delete update" aria-label="Delete update"><i class="fas fa-trash-alt"></i></button>` : '';
    return `<div class="timeline-card glass${item.dimmed?' dimmed':''}${item.isCurrent?' is-current expanded':''}${preview?' expanded':''}" data-news-id="${esc(item.id||'preview')}">
        <div class="release-card-head">
            <div class="release-icon ${channel}"><i class="fas fa-${releaseIcon}"></i></div>
            <div class="release-card-main">
                <div class="release-meta"><span class="release-version">${esc(version)}</span><span class="release-channel ${channel}">${esc(channel)}</span><span class="release-change-count">${items.length} change${items.length===1?'':'s'}</span>${item.isCurrent?'<span class="tag new">CURRENT</span>':''}</div>
                <h3>${esc(item.title||'Untitled release')}</h3><p class="release-summary">${formatNewsText(summary)}</p>
            </div>
            ${preview?'':`<div class="release-actions"><button type="button" class="release-action" data-release-action="copy" title="Copy as Markdown" aria-label="Copy release as Markdown"><i class="fas fa-copy"></i></button>${devActions}</div>`}
        </div>
        <div class="release-details"><div class="release-details-inner"><div class="release-details-content"><ul class="changelog">${list||'<li class="imp">Add at least one changelog item.</li>'}</ul></div></div></div>
        ${preview?'':`<div class="release-card-foot"><div class="release-type-summary">${typeSummary||'<span>Release notes</span>'}</div><button class="release-expand" type="button" aria-expanded="${item.isCurrent?'true':'false'}"><span>${item.isCurrent?'Hide details':'View details'}</span><i class="fas fa-chevron-down"></i></button></div>`}
    </div>`;
}
function renderNewsTimeline() {
    const timeline=document.getElementById('updatesTimeline');if(!timeline)return;
    const user=siteUsers.find(u=>u.id===currentUserId);
    const isDev=Boolean(user&&user.role==='DEV');
    const query=newsViewState.query.trim().toLowerCase();
    const language=window.SpectralI18n?.getLanguage()||'en';
    const renderKey=JSON.stringify([newsItems,query,newsViewState.filter,isDev,language]);
    if(renderKey===lastNewsTimelineKey)return;
    lastNewsTimelineKey=renderKey;
    let visible=newsItems.filter(item=>{
        const matchesType=newsViewState.filter==='all'||(item.items||[]).some(change=>validNewsType(change.type)===newsViewState.filter);
        const fields=[item.title,item.date,item.version,item.channel,item.summary,...(item.items||[]).map(change=>change.text)];
        const haystack=fields.flatMap(value=>[value,window.SpectralI18n?.translate(value||'')||'']).join(' ').toLowerCase();
        return matchesType&&(!query||haystack.includes(query));
    });
    const releaseCount=document.getElementById('updatesReleaseCount');if(releaseCount)releaseCount.textContent=String(newsItems.length);
    const changeCount=document.getElementById('updatesChangeCount');if(changeCount)changeCount.textContent=String(newsItems.reduce((n,item)=>n+(item.items||[]).length,0));
    const latestDate=document.getElementById('updatesLatestDate');if(latestDate)latestDate.textContent=newsItems[0]?.date||'—';
    const featured=newsItems.find(item=>item.isCurrent)||newsItems[0];
    if(featured){
        const featuredIcon=document.getElementById('updatesFeaturedIcon');if(featuredIcon)featuredIcon.className=`fas fa-${validNewsIcon(featured.icon)}`;
        const featuredTitle=document.getElementById('updatesFeaturedTitle');if(featuredTitle)featuredTitle.textContent=featured.title||'Latest release';
        const featuredSummary=document.getElementById('updatesFeaturedSummary');if(featuredSummary)featuredSummary.textContent=featured.summary||featured.items?.[0]?.text||'Release notes are ready.';
        const featuredVersion=document.getElementById('updatesFeaturedVersion');if(featuredVersion)featuredVersion.textContent=featured.version||'Latest';
        const featuredChannel=document.getElementById('updatesFeaturedChannel');if(featuredChannel)featuredChannel.textContent=featured.channel||'stable';
    }
    const empty=document.getElementById('updatesEmpty');if(empty)empty.hidden=visible.length>0;
    timeline.style.display=visible.length?'block':'none';
    timeline.innerHTML='<div class="timeline-line" aria-hidden="true"></div>';
    visible.forEach(item=>{
        const article=document.createElement('article');article.className='timeline-item in-view';article.dataset.newsId=item.id;
        article.innerHTML=`<div class="date-badge">${esc(item.date)}</div>${releaseCardMarkup(item,isDev,false)}`;
        const card=article.querySelector('.timeline-card');
        const expand=article.querySelector('.release-expand');
        if(expand)expand.addEventListener('click',()=>{const open=card.classList.toggle('expanded');expand.setAttribute('aria-expanded',String(open));expand.querySelector('span').textContent=open?'Hide details':'View details';});
        article.querySelectorAll('[data-release-action]').forEach(button=>button.addEventListener('click',e=>{
            e.stopPropagation();const action=button.dataset.releaseAction;
            if(action==='copy')copyLocalText(releaseToMarkdown(item),'Release copied as Markdown');
            if(action==='edit')openNewsEditor(item,false);
            if(action==='duplicate')openNewsEditor(item,true);
            if(action==='pin'){
                newsItems.forEach(news=>news.isCurrent=news.id===item.id?!item.isCurrent:false);saveNews(newsItems);renderNewsTimeline();
            }
            if(action==='delete')showConfirm(`Delete update "${item.title}"?`,()=>{newsItems=newsItems.filter(news=>news.id!==item.id);saveNews(newsItems);renderNewsTimeline();showToast('Update deleted','trash');});
        }));
        timeline.appendChild(article);
    });
}

document.addEventListener('spectral:languagechange',()=>renderNewsTimeline());

const updatesSearchInput=document.getElementById('updatesSearchInput');
if(updatesSearchInput)updatesSearchInput.addEventListener('input',()=>{newsViewState.query=updatesSearchInput.value;renderNewsTimeline();});
document.querySelectorAll('[data-news-filter]').forEach(button=>button.addEventListener('click',()=>{
    newsViewState.filter=button.dataset.newsFilter||'all';document.querySelectorAll('[data-news-filter]').forEach(other=>other.classList.toggle('active',other===button));renderNewsTimeline();
}));
const updatesReset=document.getElementById('updatesResetFilters');if(updatesReset)updatesReset.addEventListener('click',()=>{
    newsViewState={query:'',filter:'all'};if(updatesSearchInput)updatesSearchInput.value='';document.querySelectorAll('[data-news-filter]').forEach(button=>button.classList.toggle('active',button.dataset.newsFilter==='all'));renderNewsTimeline();
});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&document.getElementById('updates')?.classList.contains('active-tab')){e.preventDefault();updatesSearchInput?.focus();}});
document.getElementById('updatesFeaturedOpen')?.addEventListener('click',()=>{
    const current=newsItems.find(item=>item.isCurrent)||newsItems[0];if(!current)return;
    if(newsViewState.query||newsViewState.filter!=='all'){newsViewState={query:'',filter:'all'};if(updatesSearchInput)updatesSearchInput.value='';document.querySelectorAll('[data-news-filter]').forEach(button=>button.classList.toggle('active',button.dataset.newsFilter==='all'));renderNewsTimeline();}
    requestAnimationFrame(()=>{const article=[...document.querySelectorAll('.timeline-item')].find(item=>item.dataset.newsId===current.id);if(!article)return;article.querySelector('.timeline-card')?.classList.add('expanded');const expand=article.querySelector('.release-expand');if(expand){expand.setAttribute('aria-expanded','true');const label=expand.querySelector('span');if(label)label.textContent='Hide details';}article.scrollIntoView({behavior:(liteOn()||REDUCED_MOTION)?'auto':'smooth',block:'center'});});
});

function newsRowTemplate(type='add',text='') {
    const selected=validNewsType(type);
    const options=Object.entries(NEWS_TYPES).map(([key,meta])=>`<option value="${key}"${key===selected?' selected':''}>${meta.label}</option>`).join('');
    return `<div class="news-item-row"><div class="nie-row-main"><select class="nie-type" aria-label="Change type">${options}</select><textarea class="nie-text" rows="2" placeholder="Describe the change…" aria-label="Changelog item">${esc(text)}</textarea><div class="nie-row-actions"><button type="button" data-row-action="up" title="Move up" aria-label="Move item up"><i class="fas fa-arrow-up"></i></button><button type="button" data-row-action="down" title="Move down" aria-label="Move item down"><i class="fas fa-arrow-down"></i></button><button type="button" class="nie-remove" data-row-action="remove" title="Remove" aria-label="Remove changelog item"><i class="fas fa-times"></i></button></div></div><div class="nie-format-bar"><button type="button" data-news-format="bold" title="Bold"><b>B</b></button><button type="button" data-news-format="code" title="Inline code">&lt;/&gt;</button><button type="button" data-news-format="link" title="Link"><i class="fas fa-link"></i></button></div></div>`;
}
function updateNewsItemCount() {
    const count=document.querySelectorAll('#newsItemRows .news-item-row').length;
    const label=document.getElementById('newsItemCount');if(label)label.textContent=`${count} item${count===1?'':'s'}`;
}
function applyNewsFormat(textarea,format) {
    const start=textarea.selectionStart||0,end=textarea.selectionEnd||0,selected=textarea.value.slice(start,end);
    const wrappers={bold:['**','**','bold text'],code:['`','`','code'],link:['[','](https://)','link text']};
    const [before,after,fallback]=wrappers[format]||wrappers.bold;const content=selected||fallback;
    textarea.setRangeText(before+content+after,start,end,'select');textarea.focus();textarea.dispatchEvent(new Event('input',{bubbles:true}));
}
function bindNewsRow(row) {
    const textarea=row.querySelector('.nie-text');
    row.querySelectorAll('[data-row-action]').forEach(button=>button.addEventListener('click',()=>{
        const action=button.dataset.rowAction,rows=document.getElementById('newsItemRows');
        if(action==='remove'){if(rows.children.length>1)row.remove();else textarea.value='';}
        if(action==='up'&&row.previousElementSibling)rows.insertBefore(row,row.previousElementSibling);
        if(action==='down'&&row.nextElementSibling)rows.insertBefore(row.nextElementSibling,row);
        updateNewsItemCount();markNewsEditorDirty();updateLiveNewsPreview();
    }));
    row.querySelectorAll('[data-news-format]').forEach(button=>button.addEventListener('click',()=>applyNewsFormat(textarea,button.dataset.newsFormat)));
    row.querySelector('.nie-type')?.addEventListener('change',()=>{markNewsEditorDirty();updateLiveNewsPreview();});
    textarea?.addEventListener('input',()=>{markNewsEditorDirty();updateLiveNewsPreview();});
}
function addNewsItemRow(type='add',text='',focus=true) {
    const rows=document.getElementById('newsItemRows');if(!rows)return;
    rows.insertAdjacentHTML('beforeend',newsRowTemplate(type,text));const row=rows.lastElementChild;bindNewsRow(row);updateNewsItemCount();updateLiveNewsPreview();if(focus)row.querySelector('.nie-text')?.focus();
}
function collectNewsEditor() {
    const items=[];document.querySelectorAll('#newsItemRows .news-item-row').forEach(row=>{const text=row.querySelector('.nie-text')?.value.trim();if(text)items.push({type:validNewsType(row.querySelector('.nie-type')?.value),text});});
    return {id:editingNewsId||`news_${Date.now()}`,date:document.getElementById('newsDate')?.value.trim()||'',title:document.getElementById('newsTitle')?.value.trim()||'',version:document.getElementById('newsVersion')?.value.trim()||'',channel:document.getElementById('newsChannel')?.value||'stable',icon:validNewsIcon(document.getElementById('newsIcon')?.value),summary:document.getElementById('newsSummary')?.value.trim()||'',isCurrent:Boolean(document.getElementById('newsIsCurrent')?.checked),dimmed:false,items};
}
function updateLiveNewsPreview() {
    const host=document.getElementById('newsLivePreview');if(!host)return;const draft=collectNewsEditor();
    host.innerHTML=(!draft.title&&!draft.summary&&!draft.items.length)?'<div class="news-preview-placeholder"><div><i class="fas fa-wand-magic-sparkles"></i>Start typing to build the release preview.</div></div>':releaseCardMarkup({...draft,title:draft.title||'Untitled release',date:draft.date||'Release date'},false,true);
}
function setNewsEditorData(item) {
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.value=value||'';};
    set('newsTitle',item.title);set('newsVersion',item.version);set('newsDate',item.date);set('newsChannel',item.channel||'stable');set('newsIcon',validNewsIcon(item.icon));set('newsSummary',item.summary);
    const current=document.getElementById('newsIsCurrent');if(current)current.checked=item.isCurrent!==false;
    const rows=document.getElementById('newsItemRows');if(rows){rows.innerHTML='';(item.items?.length?item.items:[{type:'add',text:''}]).forEach(change=>addNewsItemRow(change.type,change.text,false));}
    window.SpectralControls?.refresh();
    updateNewsItemCount();updateLiveNewsPreview();
}
function readNewsDraft(){try{return JSON.parse(localStorage.getItem(NEWS_DRAFT_KEY)||'null');}catch{return null;}}
function saveNewsDraft(notify=true){const draft=collectNewsEditor();try{localStorage.setItem(NEWS_DRAFT_KEY,JSON.stringify(draft));}catch{}const status=document.getElementById('newsDraftStatus');if(status)status.innerHTML='<i class="fas fa-circle-check"></i> Draft saved locally';if(notify)showToast('Draft saved locally','floppy-disk');}
function markNewsEditorDirty(){const status=document.getElementById('newsDraftStatus');if(status)status.innerHTML='<i class="fas fa-circle"></i> Saving draft…';clearTimeout(newsDraftTimer);newsDraftTimer=setTimeout(()=>saveNewsDraft(false),700);}
function openNewsEditor(item=null,duplicate=false){
    if(item instanceof Event||!item?.id)item=null;
    if(!newsEditorOverlay)return;const restored=!item&&readNewsDraft();const source=item||restored||{date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),title:'',version:'',channel:'stable',icon:'bolt',summary:'',isCurrent:true,items:[{type:'add',text:''}]};
    editingNewsId=item&&!duplicate?item.id:null;
    const data=duplicate?{...source,title:`${source.title} (copy)`,isCurrent:false}:source;
    document.getElementById('newsEditorModeLabel').textContent=editingNewsId?'Editing release':duplicate?'Duplicate release':restored?'Restored local draft':'New release';
    document.getElementById('newsPublishLabel').textContent=editingNewsId?'Save Changes':'Publish Update';setNewsEditorData(data);
    newsEditorOverlay.classList.add('open');document.body.style.overflow='hidden';setTimeout(()=>document.getElementById('newsTitle')?.focus(),80);
}
function closeNewsEditor(){if(!newsEditorOverlay)return;newsEditorOverlay.classList.remove('open');syncBodyScrollLock();}

document.querySelectorAll('[data-add-news-type]').forEach(button=>button.addEventListener('click',()=>addNewsItemRow(button.dataset.addNewsType,'',true)));
['newsTitle','newsVersion','newsDate','newsChannel','newsIcon','newsSummary','newsIsCurrent'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{markNewsEditorDirty();updateLiveNewsPreview();}));
document.getElementById('saveNewsDraftBtn')?.addEventListener('click',()=>saveNewsDraft(true));
document.getElementById('copyNewsMarkdownBtn')?.addEventListener('click',()=>copyLocalText(releaseToMarkdown(collectNewsEditor()),'Draft copied as Markdown'));
document.getElementById('clearNewsEditorBtn')?.addEventListener('click',()=>showConfirm('Clear every field in this draft?',()=>{editingNewsId=null;try{localStorage.removeItem(NEWS_DRAFT_KEY);}catch{}setNewsEditorData({date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),channel:'stable',icon:'bolt',isCurrent:true,items:[{type:'add',text:''}]});document.getElementById('newsEditorModeLabel').textContent='New release';document.getElementById('newsPublishLabel').textContent='Publish Update';}));
const newsEditorFormV2=document.getElementById('newsEditorFormV2');
if(newsEditorFormV2)newsEditorFormV2.addEventListener('submit',e=>{
    e.preventDefault();const entry=collectNewsEditor();if(!entry.title||!entry.date){showToast('Add a release title and date','triangle-exclamation');return;}if(!entry.items.length){showToast('Add at least one changelog item','triangle-exclamation');return;}
    if(entry.isCurrent)newsItems.forEach(item=>item.isCurrent=false);
    if(editingNewsId){const index=newsItems.findIndex(item=>item.id===editingNewsId);if(index>=0)newsItems[index]={...newsItems[index],...entry,id:editingNewsId};}
    else newsItems.unshift(entry);
    saveNews(newsItems);clearTimeout(newsDraftTimer);try{localStorage.removeItem(NEWS_DRAFT_KEY);}catch{}closeNewsEditor();renderNewsTimeline();showToast(editingNewsId?'Update saved':'Update published locally','check');editingNewsId=null;
});

function renderForum() {
    const list  = document.getElementById('forumPostsList');
    const empty = document.getElementById('forumEmpty');
    const writeBtn = document.getElementById('forumWriteBtn');
    if (!list) return;
    list.innerHTML='';

    const user=siteUsers.find(u=>u.id===currentUserId);
    const isAdmin=canModerate(user);
    // Button stays visible; when logged out it shows a hint instead of the editor
    if(writeBtn)writeBtn.classList.toggle('locked', !currentUserId);
    const loginHint=document.getElementById('forumLoginHint');
    if(loginHint)loginHint.style.display=currentUserId?'none':'inline-flex';

    // Admins see pending posts (awaiting review) on top, then all approved posts
    const visible=[...forumPosts.filter(p=>!p.approved&&!p.rejected&&(isAdmin||p.authorId===currentUserId)),...forumPosts.filter(p=>p.rejected&&p.authorId===currentUserId),...forumPosts.filter(p=>p.approved)];

    if(visible.length===0){if(empty){empty.style.display='block';empty.textContent=validSupabaseConfig()&&communityCloudError?communityCloudError:'No ideas yet. Be the first to share one.';}return;}
    if(empty)empty.style.display='none';

    visible.forEach(p=>{
        const card=document.createElement('div');
        const author=siteUsers.find(u=>u.id===p.authorId);
        const authorRole=validSupabaseConfig()?p.authorRole||'USER':author?.role||'USER';
        const featured=roleRank(authorRole)>=ROLES.LEGEND.rank;
        card.className='forum-post-card'+(p.rejected?' rejected':p.approved?'':' pending')+(featured?` role-featured role-featured-${authorRole.toLowerCase()}`:'');
        if(featured)card.style.setProperty('--post-role-color',roleInfo(authorRole).color);
        const hasVoted=currentUserId&&(validSupabaseConfig()?p.viewerVoted:p.upvotes.includes(currentUserId));
        const pendingBadge=p.rejected?'<span class="fp-status fp-rejected">Rejected by review</span>':!p.approved?'<span class="fp-status fp-pending">Pending review</span>':'';
        card.innerHTML=`
            <div class="fp-header">
                <img class="fp-avatar" src="${avatarUrl(p.authorName)}" alt="${esc(p.authorName)}" width="100" height="100" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback>
                <div class="fp-meta">
                    <div class="fp-author">by ${esc(p.authorName)}${roleBadgeHtml(authorRole)}${featured?'<span class="fp-role-signal"><i class="fas fa-bolt"></i> boosted signal</span>':''}</div>
                    <div class="fp-title">${esc(p.title)}</div>
                </div>
                ${pendingBadge}
            </div>
            <div class="fp-text">${esc(p.text)}</div>
            <div class="fp-footer">
                <button class="fp-upvote${hasVoted?' voted':''}" data-id="${esc(safeIdentifier(p.id))}" ${!p.approved?'disabled':''}><i class="fas fa-arrow-up"></i> ${validSupabaseConfig()?p.voteCount||0:p.upvotes.length}</button>
                <span class="fp-date">${p.date}</span>
            </div>`;
        const upvoteBtn=card.querySelector('.fp-upvote');
        upvoteBtn.addEventListener('click',async()=>{
            if(!currentUserId){openDashboard();return;}
            if(validSupabaseConfig()){
                upvoteBtn.disabled=true;
                try{await voteCommunityIdea(p.id);}catch(error){showToast(error.message||'Could not save your vote.','triangle-exclamation');upvoteBtn.disabled=false;}
                return;
            }
            const post=forumPosts.find(x=>x.id===p.id);if(!post)return;
            const idx=post.upvotes.indexOf(currentUserId);
            if(idx>=0)post.upvotes.splice(idx,1);else post.upvotes.push(currentUserId);
            saveForum(forumPosts);renderForum();
        });
        list.appendChild(card);
    });
}

// Forum post modal
const forumPostOverlay=document.getElementById('forumPostOverlay');
function openForumPost(){
    if(!currentUserId){openDashboard();return;}
    if(!forumPostOverlay)return;
    forumPostOverlay.classList.add('open');document.body.style.overflow='hidden';
    const f=document.getElementById('forumPostForm');if(f)f.reset();
    const cc=document.getElementById('forumCharCount');if(cc)cc.textContent='0';
    const err=document.getElementById('forumPostError');if(err)err.style.display='none';
}
function closeForumPost(){if(!forumPostOverlay)return;forumPostOverlay.classList.remove('open');syncBodyScrollLock();}

document.getElementById('forumWriteBtn')&&document.getElementById('forumWriteBtn').addEventListener('click',openForumPost);
document.getElementById('forumLoginHint')&&document.getElementById('forumLoginHint').addEventListener('click',openDashboard);
document.getElementById('closeForumPostBtn')&&document.getElementById('closeForumPostBtn').addEventListener('click',closeForumPost);
if(forumPostOverlay)forumPostOverlay.addEventListener('click',e=>{if(e.target===forumPostOverlay)closeForumPost();});

const forumTextarea=document.getElementById('forumPostText');
if(forumTextarea){forumTextarea.addEventListener('input',()=>{const cc=document.getElementById('forumCharCount');if(cc)cc.textContent=forumTextarea.value.length;});}

const forumPostForm=document.getElementById('forumPostForm');
if(forumPostForm){
    forumPostForm.addEventListener('submit',async e=>{
        e.preventDefault();
        const titleEl=document.getElementById('forumPostTitle');
        const textEl=document.getElementById('forumPostText');
        const errEl=document.getElementById('forumPostError');
        const title=sanitizeField(titleEl?titleEl.value:'', 80);
        const text=sanitizeField(textEl?textEl.value:'', 500);
        if(!title){if(errEl){errEl.textContent='Please enter a title';errEl.style.display='block';}return;}
        if(!text){if(errEl){errEl.textContent='Please describe your idea';errEl.style.display='block';}return;}
        if(errEl)errEl.style.display='none';
        if(validSupabaseConfig()){
            const submit=forumPostForm.querySelector('[type="submit"]');if(submit)submit.disabled=true;
            try{const decision=await submitCommunityIdea(title,text);closeForumPost();showToast(decision==='approved'?'Idea published after automatic review.':'Idea rejected by automatic review.',decision==='approved'?'check':'triangle-exclamation');}
            catch(error){if(errEl){errEl.textContent=error.message||'Could not submit the idea.';errEl.style.display='block';}}
            finally{if(submit)submit.disabled=false;}
            return;
        }
        const user=siteUsers.find(u=>u.id===currentUserId);
        const localTitle=censor(title),localText=censor(text);
        const today=new Date();
        const dateStr=`${String(today.getDate()).padStart(2,'0')}.${String(today.getMonth()+1).padStart(2,'0')}.${today.getFullYear()}`;
        const post={id:'fp_'+Date.now(),authorId:currentUserId,authorName:user?user.displayName||user.username:'?',title:localTitle,text:localText,date:dateStr,upvotes:[],approved:false,rejected:false};
        forumPosts.unshift(post);saveForum(forumPosts);closeForumPost();
        renderForum();
        // notify user
        showToast('Idea submitted for moderator review. Thank you!','check');
    });
}
// ══════════════════════════════════════════════════════════════
// INITIAL RENDER
// ══════════════════════════════════════════════════════════════
renderAll();
if (currentUserId) beginUserSession();

// Cloud auth is opt-in. When configured, initialization restores only the
// authenticated user's owner-scoped data; otherwise the site stays local.
const accountsSection = document.getElementById('accounts');
if (!validSupabaseConfig()) accountsSection?.classList.remove('accounts-booting');
initSupabaseAuth()
    .catch(()=>console.warn('[startup] Optional authentication is unavailable; local mode remains active.'))
    .finally(()=>accountsSection?.classList.remove('accounts-booting'));

// Keep an open site in sync with profiles added or removed in the launcher.
let lastMinecraftRefresh = 0;
async function refreshMinecraftProfilesIfDue() {
    if (document.hidden || !currentUserId || currentUserId !== cloudAuthUserId
        || mcSaveInProgress || Date.now() - lastMinecraftRefresh < 5000) return;
    lastMinecraftRefresh = Date.now();
    await refreshMinecraftProfiles();
}
window.addEventListener('focus', refreshMinecraftProfilesIfDue);
document.addEventListener('visibilitychange', refreshMinecraftProfilesIfDue);
setInterval(refreshMinecraftProfilesIfDue, 15000);

}); // DOMContentLoaded
