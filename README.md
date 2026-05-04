# 🎮 CollabSudoku — мультиплеер на Supabase

Судоку в реальном времени для двух игроков. Синхронизация через **Supabase Realtime** (WebSocket, без Ably).

---

## ⚡ Шаг 1 — Supabase (5 минут, бесплатно)

1. Зайди на **https://supabase.com** → **Start your project** (Sign up бесплатно)
2. Нажми **New project** → придумай имя → создай
3. Подожди ~1 минуту пока проект поднимается
4. Перейди: **Settings → API**
5. Скопируй:
   - **Project URL** → вида `https://abcdefgh.supabase.co`
   - **anon public** key → длинная строка

> ⚠️ Больше ничего в Supabase делать не надо — таблицы не нужны.
> Мы используем только Broadcast каналы (чистый WebSocket).

---

## 🖥️ Шаг 2 — Запуск локально

```bash
# 1. Установить зависимости
npm install

# 2. Создать .env
cp .env.example .env

# 3. Заполнить .env:
#    VITE_SUPABASE_URL=https://xxxx.supabase.co
#    VITE_SUPABASE_ANON_KEY=eyJ...

# 4. Запустить
npm run dev
# → http://localhost:5173
```

**Тест вдвоём локально:**
- Открой `localhost:5173` в обычном окне → создай комнату
- Открой в режиме инкогнито → нажми «🔗 Пригласить друга» в первом окне → скопируй ссылку → вставь во второе

---

## 🚀 Деплой на Vercel (рекомендуется)

```bash
npm i -g vercel
vercel login
vercel
# Framework: Vite, Build: npm run build, Output: dist

# Добавь переменные окружения:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

vercel --prod
```

Или через сайт vercel.com → New Project → Import Git → добавь env vars → Deploy.

---

## 🎮 Как играть

| Действие | Как |
|---|---|
| Выбрать клетку | Клик мышью |
| Ввести цифру | Клавиатура 1–9 или кнопки |
| Удалить | Backspace / Delete / кнопка ✕ |
| Навигация | Стрелки ←↑→↓ |
| Пригласить | Кнопка «🔗 Пригласить друга» |

### Цвета
- ⬛ **Чёрный** — условие задачи (нельзя изменить)
- 🔵 **Синий** — цифры создателя комнаты
- 🔴 **Красный** — цифры второго игрока
- Красная цифра в неверной клетке = ошибка
- Маленькая цветная точка в углу = где сейчас курсор партнёра

---

## 🔧 Как работает синхронизация

```
Игрок 1 ставит цифру
    → publish('cell-update', { index, value, owner: 'blue' })
    → Supabase Broadcast WebSocket
    → Игрок 2 получает событие
    → setBoard(...) → цифра появляется синей у обоих
```

**Board-sync для опоздавших:**
Когда второй игрок входит, хост (первый по времени) автоматически
шлёт полный снимок доски — второй игрок видит все уже сделанные ходы.

---

## 🧩 Стек

- **React 18** + **Vite**
- **Supabase Realtime** (Broadcast + Presence) — вместо Ably
- **Tailwind CSS**
- **Syne** (UI) + **DM Mono** (цифры)
