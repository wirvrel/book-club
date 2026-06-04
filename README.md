# 📚 Book Club Platform — Вебплатформа для спільноти книголюбів

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js Version" />
  <img src="https://img.shields.io/badge/Fastify-4.x-black?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
</p>

---

## 🎯 Про проєкт

**Book Club Platform** — це сучасна високопродуктивна вебплатформа для любителів читання. Проєкт поєднує в собі функції каталогізатора особистої домашньої бібліотеки, інтерактивного трекера читання в реальному часі та соціальної мережі для обговорення книг.

Платформа розроблена в межах дипломної роботи на тему **«Створення вебплатформи для спільноти книголюбів»**.

---

## 🌟 Основний функціонал

### 📖 Каталог та Пошук

- **Повнотекстовий пошук** за назвою книги, авторами або унікальним кодом ISBN.
- **Багатофакторна фільтрація** за жанрами, роками видання, мовою оригіналу та рейтингом.
- **Детальні профілі книг** із сюжетним описом, цікавими фактами та інформацією про екранізації.

### 📚 Персональна бібліотека та Полиці

- **Стандартні полиці:** автоматичне створення розділів «Хочу прочитати», «Читаю зараз» та «Прочитано».
- **Кастомні списки:** створення необмеженої кількості користувацьких полиць.
- **Трекер прогресу:** фіксація прочитаних сторінок та нотаток з автоматичним перерахунком відсотків.

### 👥 Соціальна взаємодія

- **Система підписок** на інших користувачів та персоналізована стрічка активності друзів.
- **Оцінки та рецензії** (одна рецензія на книгу від користувача) з можливістю лайків та вкладеного коментування.
- **Цитатник:** збереження улюблених висловів з книг із маркуванням спойлерів.
- **Колекції:** створення публічних або приватних тематичних підбірок книг.

### 🛡 Адміністрування та Модерація

- **Dashboard** зі зведеною статистикою активності користувачів.
- **Система пропозицій:** обробка заявок від користувачів на додавання нових книг та авторів.
- **Модерація контенту:** CRUD-керування базою даних та блокування порушників.

---

## 🛠 Технологічний стек

### Backend (Серверна частина)

- **Runtime:** Node.js (LTS)
- **HTTP фреймворк:** Fastify (високопродуктивний, з мінімальним оверхедом)
- **ORM:** Drizzle ORM (TypeScript-first взаємодія з БД)
- **Валідація:** Zod (валідація схем вхідних запитів)
- **Автентифікація:** JWT (Access/Refresh токени в httpOnly Cookie) + Google OAuth 2.0

### Frontend (Клієнтська частина)

- **Бібліотека:** React 19 (Single Page Application)
- **Build Tool:** Vite 8
- **Роутинг:** React Router 7
- **Керування станом:** Redux Toolkit & RTK Query (кешування API запитів)
- **UI-компоненти:** React Aria Components (стандарти доступності WAI-ARIA)
- **Стилізація:** CSS Modules, Framer Motion (анімація інтерфейсу)

### База даних та Деплой

- **СКБД:** PostgreSQL 15+ (тригери на рівні PL/pgSQL для автоматичного перерахунку рейтингів)
- **Контейнеризація:** Docker, Docker Compose
- **Проксі-сервер:** Nginx

---

## 📐 Архітектура системи

Проєкт побудований за принципом **Monorepo** з чітким розділенням відповідальності:

```mermaid
graph TD
    Client[React 19 Frontend SPA] -->|HTTP REST API / JSON| Router[Fastify Router]
    Router -->|Validate Schemas| Zod[Zod Validation]
    Zod -->|Execute Request| Services[Business Logic Services]
    Services -->|Query / Mutate| Drizzle[Drizzle ORM]
    Drizzle -->|SQL Queries| DB[(PostgreSQL Database)]
    DB -->|Triggers PL/pgSQL| Triggers[Auto Calculate Ratings & Statistics]
```

---

## 🗂 Структура репозиторію

```
book-club/
├── backend/                 # Серверний додаток (Fastify API)
│   ├── config/              # Конфігураційні файли середовища
│   ├── db/                  # Робота з PostgreSQL (Drizzle схеми, міграції, seeds)
│   ├── handlers/            # Обробники маршрутів (Routes & Controllers)
│   ├── services/            # Бізнес-логіка додатку
│   ├── middleware/          # Перевірка токенів, CORS, завантаження файлів
│   └── src/index.ts         # Точка входу сервера
│
├── frontend/                # Клієнтський SPA-додаток (React)
│   ├── public/              # Статичні ресурси
│   ├── src/
│   │   ├── app/             # Ініціалізація Store, Router та провайдерів
│   │   ├── features/        # Функціональні модулі (Auth, Books, Shelves тощо)
│   │   ├── components/      # Глобальна бібліотека UI-компонентів
│   │   ├── pages/           # Компоненти сторінок додатку
│   │   └── main.tsx         # Точка входу React-додатка
│
├── docker-compose.yml       # Сценарій Docker Compose для деплою
├── package.json             # Залежності monorepo
└── README.md                # Головний опис проєкту
```

---

## 🚀 Швидкий запуск

### 1. Клонування репозиторію та встановлення залежностей

Переконайтеся, що на вашому комп'ютері встановлено **Node.js 20+** та менеджер пакетів **pnpm** (або npm/yarn).

```bash
git clone https://github.com/ваше_ім'я/book-club.git
cd book-club
pnpm install
```

### 2. Налаштування змінних оточення

Створіть файл `.env` у кореневій директорії на основі `.env.example`:

```bash
cp .env.example .env
```

Вкажіть ваші налаштування для підключення до бази даних та ключів безпеки:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/book_club
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Налаштування бази даних

Застосуйте міграції Drizzle для створення таблиць у вашій локальній PostgreSQL та заповніть базу початковими тестовими даними (seeds):

```bash
# Генерація та застосування міграцій
pnpm db:migrate

# Заповнення бази тестовими книгами та користувачами
pnpm db:seed
```

### 4. Запуск у режимі розробки

Запустіть обидва сервери (Backend API на порті `3000` та Frontend SPA на порті `5173`) однією командою:

```bash
pnpm dev
```

---

## 🧑‍💻 Розробник

- **Автор проєкту:** [Зизень Мар'яна Василівна](https://github.com/wirvrel)

---

## 📄 Ліцензія

Цей проєкт ліцензовано за умовами [MIT License](LICENSE).
