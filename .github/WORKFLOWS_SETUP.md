# GitHub Secrets для CI/CD

Для работы новых workflows нужно настроить следующие secrets в GitHub репозитории.

## Как добавить secrets

1. Перейти в **Settings** → **Secrets and variables** → **Actions**
2. Нажать **New repository secret**
3. Добавить каждый из нижеперечисленных secrets

## Требуемые secrets

### Docker Hub (для push образов)

- **DOCKERHUB_USERNAME** - ваш username на Docker Hub
- **DOCKERHUB_TOKEN** - ваш access token с правами для push

[Как создать Docker Hub token](https://docs.docker.com/security/for-developers/access-tokens/)

### Email notifications (для отправки писем)

- **MAIL_SERVER** - SMTP сервер (например: `smtp.gmail.com`)
- **MAIL_PORT** - SMTP порт (обычно: `587` для TLS или `465` для SSL)
- **MAIL_USERNAME** - email/username для SMTP
- **MAIL_PASSWORD** - пароль или app password
- **MAIL_FROM** - адрес отправителя (может совпадать с MAIL_USERNAME)

#### Пример для Gmail:
```
MAIL_SERVER: smtp.gmail.com
MAIL_PORT: 587
MAIL_USERNAME: your-email@gmail.com
MAIL_PASSWORD: your-app-password (не обычный пароль!)
MAIL_FROM: your-email@gmail.com
```

[Как создать App Password для Gmail](https://myaccount.google.com/apppasswords)

## Workflows описание

### 1. **CI - Tests & Build** (`ci.yml`)
Запускается на push/PR для всех веток (main, develop, stable, feature/*)

**Этапы:**
- ✅ Backend Lint (black, isort, flake8)
- ✅ Backend Unit Tests (pytest с coverage)
- ✅ Frontend Lint (ESLint, Prettier)
- ✅ Frontend Unit Tests & Build
- ✅ Docker Build (без push на другие ветки)
- ✅ Test Summary

**Выводит:** Результаты в GitHub Actions

### 2. **Email Notifications** (`notify-email.yml`)
Запускается после завершения CI workflow

**Отправляет на:** ltpddwk@gmail.com

**Информация в письме:**
- Статус пайплайна (успех/ошибка)
- Ветка и автор
- Коммит
- Ссылка на GitHub Actions

### 3. **Deploy to Production** (`deploy-production.yml`)
Запускается только на push в ветку `stable`

**Действия:**
- Сборка и push Docker образов в Docker Hub
- Создание Release на GitHub
- Отправка email уведомления о деплойменте

**Теги образов:**
- `latest`
- `production`
- `{version}` (из git tag или SHA)

## Тестирование workflows

### Вручную запустить workflow
```bash
# Deploy workflow (требует manual trigger)
gh workflow run deploy-production.yml -r stable --ref stable
```

### Проверить статус
```bash
gh run list -w ci.yml -L 5
```

### Посмотреть логи
```bash
gh run view {RUN_ID} -L
```

## Troubleshooting

### Email не приходит
1. Проверьте secrets в GitHub Settings
2. Посмотрите логи в GitHub Actions
3. Убедитесь, что SMTP credentials верные
4. Проверьте firewall/SMTP limits

### Docker push fails
1. Проверьте DOCKERHUB_USERNAME и DOCKERHUB_TOKEN
2. Убедитесь, что token имеет права на push
3. Проверьте имя репозитория в docker-compose файлах

### Tests не запускаются
1. Убедитесь, что есть тестовые файлы (`test_*.py`, `*.test.js`)
2. Проверьте dependencies в requirements.txt и package.json
3. Посмотрите логи в GitHub Actions для деталей ошибки
