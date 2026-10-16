# Soul Star — персональный калькулятор пятиконечной звезды

Production-ready MVP: расчёт по дате рождения, интерактивная звезда, последовательное раскрытие сфер, аккаунты, админка, оплаты, email, аналитика, EN + AR (RTL).

## Стек

- Next.js 15 (App Router) + TypeScript
- Prisma + **PostgreSQL** (локально Docker, в проде Supabase Cloud или любой Postgres). Auth.js пишет в `users`; звёзды живут в `birth_profiles` и привязываются к аккаунту.
- Auth.js (credentials: email + пароль, восстановление доступа)
- next-intl: `ru` (язык дизайна), `en`, `ar` (RTL; SVG-звезда не зеркалится)
- Платежи: абстракция `PaymentProvider` — **mock** (из коробки), **Stripe**, **ЮKassa / СБП**
- Email: mock / Resend
- Meta Pixel + Conversions API с общим `event_id`

Расчётный движок (`src/lib/engine`) независим от UI, БД и платежей.

## Быстрый старт

```bash
cp .env.example .env
npm install
npm run db:up          # встроенный Postgres; либо: docker compose up -d db
npx prisma db push
npx tsx prisma/seed.ts
npm test
npm run dev
```

Открыть http://localhost:3000 (редирект на `/ru`).

### Демо-аккаунты (после seed)

| Роль   | Email                    | Пароль               |
|--------|--------------------------|----------------------|
| Admin  | admin@soulstar.local     | ChangeMe_Admin_2026  |
| Tester | tester@soulstar.local    | tester1234           |
| User   | kamilla@example.com      | demo1234             |

У Камиллы один расчёт **05.03.1992** (контрольный пример) и открытая сфера «Личность».

У Tester четыре звезды с разными entitlements: только Личность / две сферы / три / все пять — чтобы проверять locked/unlocked без оплаты.

Админка: `/ru/admin`  
Unlocks (реальные entitlements): `/ru/admin/unlocks`  
Debug расчёта: `/ru/admin/debug`

## Формулы (книга + рукописная схема)

Система 22 арканов: 1–22 без изменений, иначе сумма цифр до ≤ 22.

| Точка | Буква на схеме | Формула |
|-------|----------------|---------|
| Личность (лево) | A | день месяца |
| Духовность (верх) | B | месяц |
| Реализация (право) | C | сумма цифр года |
| Отношения (низ-право) | F | A+B+C |
| Здоровье (низ-лево) | H | A+B+C+F |
| Миссия души (центр) | L | A+B+C+F+H |
| Родовые программы | D E G K | соседние вершины |
| Роковая ошибка | J = H+F | между отношениями и здоровьем |

Внутренние треугольники: `apex+left`, `apex+right`, `left+right`.

Контроль 05.03.1992: **5, 3, 21, 11, 4, 8** и P12=8, P23=6, P34=5, P45=15, P51=9. Личность внутри: 14, 13, 17.

## Покупки

Сферы открываются **только по порядку** (настраивается в админке). Расчёт и схема звезды бесплатны. Четыре раздела — $25, полный пакет — $69, здоровье в подарок с пакетом.

Оплата **никогда** не открывает контент с клиента: checkout → провайдер → webhook (идемпотентный) → запись в журнале транзакций (`ledger_events`) → entitlement только при `purchase.status=paid` и `paidAt` → email → analytics/Meta.

Платная расшифровка не уходит в HTML, пока сервер не подтвердил оплату (или служебное открытие админом). Статусы pending / failed / canceled доступ не дают.

Журнал: `/ru/admin/purchases` — оплаты и неизменяемая лента событий.

## Резервные копии

Ежедневный `pg_dump` на VPS:

```bash
cp deploy/soul-star-backup.service deploy/soul-star-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now soul-star-backup.timer
```

Каталог `/var/backups/soul-star`, сжатие gzip, права 600, хранение 14 дней (`BACKUP_KEEP_DAYS`). Опционально шифрование: `BACKUP_GPG_RECIPIENT` в `/etc/soul-star.env`. Восстановление: `bash scripts/restore-db.sh /var/backups/soul-star/soulstar-….sql.gz`.

Локально: `BACKUP_DIR=./backups bash scripts/backup-db.sh`.

## Персональные данные

Политика: `/legal/privacy`. В кабинете: выгрузка JSON (`/api/me/export`) и удаление ПДн (имя, почта, даты, расчёты). Журнал оплат сохраняется для учёта. Пароль — только хеш. Cookie: сессия, гость, посетитель, UTM.

Mock-оплата: страница «Оплатить / Отклонить». Для живых платежей заполните ключи и поставьте `PAYMENT_PROVIDER=stripe` или `yookassa`.

## Env

См. `.env.example`. Обязательно смените `AUTH_SECRET` и пароль админа перед продакшеном.

| Ключ | Назначение |
|------|------------|
| `DATABASE_URL` | Postgres URL (локальный Docker или Supabase) |
| `NEXT_PUBLIC_SUPABASE_*` | опциональный JS-клиент; сессии остаются на Auth.js |
| `AUTH_SECRET` | секрет сессий |
| `PAYMENT_PROVIDER` | `mock` / `stripe` / `yookassa` |
| `STRIPE_*` | международные карты |
| `YOOKASSA_*` | РФ, карты и СБП |
| `EMAIL_PROVIDER` | `mock` / `resend` |
| `NEXT_PUBLIC_META_PIXEL_ID` | Pixel |
| `META_CAPI_ACCESS_TOKEN` | Conversions API |

## GitHub

Код: [github.com/nikolaytwins/soulid](https://github.com/nikolaytwins/soulid).

```bash
git remote add origin git@github.com:nikolaytwins/soulid.git
git push -u origin main
```

## Деплой на VPS (test.twinlabs.ru)

Сервер: `root@178.72.168.156`, каталог `/root/soul-star`, systemd `soul-star`, env `/etc/soul-star.env`.

После `git pull` на сервере:

```bash
bash /root/soul-star/scripts/vps-build.sh
```

Nginx проксирует на `127.0.0.1:3010`. Webhook-пути:

- `/api/payments/webhooks/stripe`
- `/api/payments/webhooks/yookassa`

## Что заполняет заказчик

- Авторские тексты расшифровок (сейчас `[DEMO]` / `isDemo=true` в CMS)
- Юридические страницы `/legal/privacy` и `/legal/terms`
- Боевые ключи Stripe / ЮKassa / Resend / Meta
- Домен и TLS
- Логотип, если нужен вместо слова Soul Star

## Архитектура контента

Админ правит: `сфера + точка + значение аркана + locale + title + body (JSON)`. Для «Реализации» `contentType=structured` (Талант / плюс / минус / рекомендации). Один и тот же аркан в разных сферах — разные тексты. Точка P12 в личности и в духовности хранится отдельно.

Комбинации и повторы: таблица `pattern_rules`. Движок (`matchPatternRules`) считает числа на звезде независимо от CMS. Админ заполняет текст для `repeating` (одно число ≥ N раз) или `combination` (все значения присутствуют). Авторские трактовки не выдумываются кодом — seed кладёт только `[DEMO]`.

Регистрация: гостевой расчёт живёт по cookie `ss_guest` и при логине/регистрации привязывается к `users.id`. Страница `/account` показывает все звёзды профиля.

Подключение к Supabase Cloud: см. `supabase/README.md`. RLS — `supabase/rls.sql`.

Слой готов к будущей AI-генерации: UI читает только `getInterpretation()`, а не зашитые строки.

## Тесты

```bash
npm test
```

Покрывают `reduceToArcana`, A1–A6, мосты, треугольники и пример из книги.
