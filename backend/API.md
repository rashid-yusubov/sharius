# Sharius Backend API

Краткая документация по backend-сервису.

## Общая информация

- Стек: `FastAPI` + `SQLAlchemy`.
- Базовые роуты подключаются из `auth`, `profile`, `users`, `contacts`, `sessions`, `health`.
- Все обычные JSON-ответы возвращаются в формате:

```json
{
  "success": true,
  "data": {}
}
```

- Ошибки приходят в формате:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE"
  }
}
```

## Авторизация

- Для защищённых эндпоинтов нужен заголовок `Authorization: Bearer <jwt_token>`.
- JWT выдаётся после регистрации и логина.
- Для части операций с сессиями можно использовать `X-Creator-Token`.
- `X-Creator-Token` возвращается при создании сессии и даёт право редактировать или удалить её даже без обычной авторизации.

## Эндпоинты

### Health

#### `GET /`

Проверка, что backend запущен.

Ответ:
- `message: "Backend is running"`

#### `GET /health`

Технический healthcheck.

Ответ:
- `status: "ok"`

### Auth

#### `POST /auth/register`

Регистрация пользователя.

Тело:
- `login`: от 3 до 100 символов
- `password`: от 6 до 255 символов
- `display_name`: от 1 до 255 символов

Что делает:
- создаёт пользователя;
- хеширует пароль;
- сразу возвращает JWT токен.

Ошибки:
- `400 LOGIN_ALREADY_EXISTS`

#### `POST /auth/login`

Логин пользователя.

Тело:
- `login`
- `password`

Что делает:
- проверяет логин и пароль;
- возвращает JWT токен и данные пользователя.

Ошибки:
- `401 INVALID_CREDENTIALS`
- `404 USER_NOT_FOUND`

#### `GET /auth/me`

Возвращает профиль текущего пользователя.

Требует:
- `Authorization: Bearer <token>`

Ошибки:
- `401 UNAUTHORIZED`
- `401 TOKEN_INVALID`

### Profile

#### `PATCH /profile`

Обновляет `display_name` текущего пользователя.

Тело:
- `display_name`: от 1 до 255 символов

Требует:
- `Authorization: Bearer <token>`

### Users

#### `GET /users/search?query=...`

Ищет пользователей по `login` и `display_name`.

Требует:
- `Authorization: Bearer <token>`

Параметры:
- `query`: от 1 до 100 символов

Что делает:
- исключает текущего пользователя из результатов;
- ищет по подстроке;
- сортирует по `login`;
- ограничивает результат 20 записями.

### Contacts

#### `POST /contacts/requests`

Отправляет заявку в контакты.

Тело:
- `user_id`: UUID пользователя

Требует:
- `Authorization: Bearer <token>`

Ошибки:
- `400 CANNOT_ADD_SELF`
- `400 CONTACT_REQUEST_ALREADY_EXISTS`
- `404 USER_NOT_FOUND`

#### `GET /contacts/requests/incoming`

Возвращает входящие заявки в контакты со статусом `pending`.

Требует:
- `Authorization: Bearer <token>`

#### `POST /contacts/requests/{request_id}/accept`

Принимает входящую заявку.

Требует:
- `Authorization: Bearer <token>`

Что делает:
- переводит заявку в `accepted`;
- создаёт двустороннюю связь контактов.

Ошибки:
- `400 REQUEST_ALREADY_RESOLVED`
- `403 FORBIDDEN`
- `404 REQUEST_NOT_FOUND`

#### `POST /contacts/requests/{request_id}/reject`

Отклоняет входящую заявку.

Требует:
- `Authorization: Bearer <token>`

Что делает:
- переводит заявку в `rejected`.

Ошибки:
- `400 REQUEST_ALREADY_RESOLVED`
- `403 FORBIDDEN`
- `404 REQUEST_NOT_FOUND`

#### `GET /contacts`

Возвращает список контактов текущего пользователя.

Требует:
- `Authorization: Bearer <token>`

#### `DELETE /contacts/{user_id}`

Удаляет контакт у обеих сторон.

Требует:
- `Authorization: Bearer <token>`

Ошибки:
- `404 CONTACT_NOT_FOUND`

### Sessions

Сессия это временная сущность для обмена текстом и файлами.

Особенности:
- код сессии приводится к верхнему регистру;
- если код не передан, генерируется автоматически;
- при создании всегда создаётся текстовый блок, даже если он пустой;
- сессия истекает по TTL;
- истёкшая или деактивированная сессия считается недоступной;
- в фоне работает очистка истёкших сессий.

#### `POST /sessions`

Создаёт сессию.

Тело:
- `custom_code`: необязательный код, максимум 32 символа
- `content`: стартовый текст

Авторизация:
- не обязательна;
- если пользователь авторизован, его `user_id` сохраняется как создатель.

Ответ:
- данные сессии;
- `creator_token` для последующих операций редактирования.

Ошибки:
- `400 CODE_ALREADY_EXISTS`

#### `GET /sessions/{code}`

Возвращает данные сессии по коду.

Ошибки:
- `404 SESSION_NOT_FOUND`
- `410 SESSION_EXPIRED`

#### `PUT /sessions/{code}/text`

Обновляет текст сессии.

Тело:
- `content`

Доступ:
- либо `Authorization: Bearer <token>` от создателя;
- либо `X-Creator-Token`.

Ошибки:
- `403 FORBIDDEN`
- `404 SESSION_NOT_FOUND`
- `410 SESSION_EXPIRED`

#### `POST /sessions/{code}/files`

Загружает файл в сессию.

Формат:
- `multipart/form-data`
- поле `file`

Доступ:
- либо `Authorization: Bearer <token>` от создателя;
- либо `X-Creator-Token`.

Ограничения:
- максимум `100 MB`;
- разрешённые расширения: `txt`, `docx`, `pdf`, `png`, `jpg`, `jpeg`.

Ошибки:
- `400 FILE_TYPE_NOT_ALLOWED`
- `400 FILE_TOO_LARGE`
- `403 FORBIDDEN`
- `404 SESSION_NOT_FOUND`
- `410 SESSION_EXPIRED`

#### `GET /sessions/{code}/files/{file_id}`

Скачивает файл из сессии.

Ошибки:
- `404 SESSION_NOT_FOUND`
- `404 FILE_NOT_FOUND`
- `410 SESSION_EXPIRED`

#### `DELETE /sessions/{code}/files/{file_id}`

Удаляет файл из сессии.

Доступ:
- либо `Authorization: Bearer <token>` от создателя;
- либо `X-Creator-Token`.

Ошибки:
- `403 FORBIDDEN`
- `404 SESSION_NOT_FOUND`
- `404 FILE_NOT_FOUND`
- `410 SESSION_EXPIRED`

#### `DELETE /sessions/{code}`

Удаляет сессию целиком вместе с файлами.

Доступ:
- либо `Authorization: Bearer <token>` от создателя;
- либо `X-Creator-Token`.

Ошибки:
- `403 FORBIDDEN`
- `404 SESSION_NOT_FOUND`
- `410 SESSION_EXPIRED`

#### `POST /sessions/for-contact/{user_id}`

Создаёт сессию только для пользователя, который уже есть в контактах.

Тело:
- `custom_code`: необязательный код
- `content`: стартовый текст

Требует:
- `Authorization: Bearer <token>`

Ошибки:
- `400 CODE_ALREADY_EXISTS`
- `404 CONTACT_NOT_FOUND`

## Основные сущности

### Пользователь

- `id`
- `login`
- `display_name`
- `created_at`
- `updated_at`

### Сессия

- `id`
- `code`
- `creator_token`
- `is_active`
- `created_at`
- `updated_at`
- `expires_at`
- `text`
- `files`

### Файл сессии

- `id`
- `original_name`
- `mime_type`
- `extension`
- `size_bytes`
- `created_at`

## Поведение фона

- При старте приложения запускается фоновый цикл очистки истёкших сессий.
- Такие сессии удаляются вместе с привязанными файлами.
