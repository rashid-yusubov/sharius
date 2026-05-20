<p align="center">
    <picture>
      <source media="(prefers-color-scheme: light)" srcset="./doc/images/readme/pt-hero.light.png" />
      <img src="https://github.com/user-attachments/assets/4c13c2ad-d850-4365-be47-a6d52092e2d8" />
  </picture>
</p>
<h1 align="center">
  <span>Sharius</span>
</h1>
<p align="center">
  <span align="center">Веб-приложение для мгновенного обмена данными между устройствами.</span>
</p>

---

## 📌 О проекте

**Sharius** — веб-приложение, предназначенное для быстрого и удобного обмена текстовыми данными и файлами между различными устройствами (ноутбук, смартфон, планшет) в режиме реального времени.

Приложение позволяет обмениваться информацией **прямо в браузере** без установки дополнительных программ. Поддерживается работа как без регистрации (гость), так и с аккаунтом (расширенные возможности).

Проект разрабатывается в рамках дисциплины **«Системная и программная инженерия»**.

---

## 🚀 Основные возможности

### Режим «Гость» (без регистрации)
- Автоматическая генерация кода сессии
- Возможность задать свой код сессии
- Обмен текстом (ввод, копирование, вставка)
- Передача файлов (до 100 МБ)
- Просмотр и сканирование QR-кода сессии
- Автоматическое удаление данных по истечении таймера

### Режим «Зарегистрированный пользователь»
- Регистрация и авторизация
- Редактирование профиля
- Система контактов (отправка/приём заявок, поиск пользователей)
- Отправка данных напрямую контактам
- Уведомления о событиях

---

## 🛠️ Технологический стек

### Frontend

| Технология          | Название                  |
|---------------------|---------------------------|
| <img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB&style=flat-square" alt="React" height="28"/> | **React** |
| <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000&style=flat-square" alt="JavaScript" height="28"/> | **JavaScript** |
| <img src="https://img.shields.io/badge/CSS/SCSS-1572B6?logo=css3&logoColor=white&style=flat-square" alt="CSS" height="28"/> | **CSS / SCSS** |

### Backend

| Технология          | Название                        |
|---------------------|---------------------------------|
| <img src="https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white&style=flat-square" alt="Python" height="28"/> | **Python 3.11+** |
| <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&style=flat-square" alt="FastAPI" height="28"/> | **FastAPI** |
| <img src="https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white&style=flat-square" alt="PostgreSQL" height="28"/> | **PostgreSQL** |
| <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=flat-square" alt="Docker" height="28"/> | **Docker + docker-compose** |
---

## 📂 Структура проекта
```
sharius/
├── backend/                    # Основная часть проекта
│   ├── app/
│   │   ├── api/                # Роуты
│   │   ├── models/             # SQLAlchemy модели
│   │   ├── schemas/            # Pydantic схемы
│   │   ├── services/           # Бизнес-логика
│   │   └── ...
│   ├── alembic/                # Миграции
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── docs/                       # Документация
├── LICENCE.md
└── README.md
```

## 👨‍💻 Команда разработчиков

<a href="https://github.com/rashid-yusubov/sharius/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rashid-yusubov/sharius" />
</a>

## 📄 Лицензия
Проект распространяется под лицензией MIT.

Подробнее: [LICENCE.md](https://github.com/rashid-yusubov/sharius/blob/main/LICENCE.md)
