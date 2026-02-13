# Настройка GitHub Actions для XaTube

## 🎯 Быстрая настройка

### Шаг 1: Добавить секреты в GitHub

1. Откройте ваш репозиторий: https://github.com/artyom-develop/video-hosting-platform
2. Перейдите: **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**

### Шаг 2: Создать необходимые секреты

#### Минимальная конфигурация (для CI/CD с Docker Hub):

```
Имя: DOCKERHUB_USERNAME
Значение: artem1003
```

```
Имя: DOCKERHUB_TOKEN  
Значение: [Создайте на https://app.docker.com/settings/personal-access-tokens]
```

#### Дополнительно (для автодеплоя на VPS):

```
Имя: VPS_HOST
Значение: [IP вашего сервера, например: 185.xxx.xxx.xxx]
```

```
Имя: VPS_USER
Значение: [SSH пользователь, например: root]
```

```
Имя: SSH_PRIVATE_KEY
Значение: [SSH ключ в base64 - см. инструкцию ниже]
```

---

## 📖 Подробная инструкция

### 1. Получение Docker Hub Token

1. Войдите в Docker Hub: https://hub.docker.com
2. Перейдите: **Account Settings** → **Security** → **Personal Access Tokens**
3. Нажмите **Generate New Token**
4. Имя: `GitHub Actions XaTube`
5. Права: **Read, Write, Delete**
6. Скопируйте токен (показывается один раз!)

### 2. Подготовка SSH ключа для VPS

#### Windows PowerShell:
```powershell
# Конвертировать существующий ключ
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\.ssh\id_rsa"))

# Или создать новый ключ
ssh-keygen -t rsa -b 4096 -C "github-actions@xatube"
# Сохраните в: C:\Users\User\.ssh\github_actions_rsa

# Затем конвертируйте
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\.ssh\github_actions_rsa"))
```

#### Linux/Mac:
```bash
# Конвертировать ключ
base64 -w 0 ~/.ssh/id_rsa

# Или создать новый
ssh-keygen -t rsa -b 4096 -C "github-actions@xatube"
cat ~/.ssh/id_rsa | base64 -w 0
```

### 3. Добавление публичного ключа на VPS

```bash
# На VPS выполните:
mkdir -p ~/.ssh
echo "СОДЕРЖИМОЕ id_rsa.pub" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

---

## 🔧 Настройка workflows

### Файлы workflow в проекте:

1. **`.github/workflows/ci.yml`** - Continuous Integration
   - Проверка кода
   - Линтинг (black, flake8, isort)
   - Unit тесты
   - Сборка Docker образов

2. **`.github/workflows/deploy-production.yml`** - Production Deployment
   - Публикация образов в Docker Hub
   - Создание GitHub релизов
   - Деплой на VPS

### Когда запускаются:

| Workflow | Триггер | Ветки |
|----------|---------|-------|
| CI | Push, Pull Request | `main`, `develop`, `stable` |
| Deploy | Push | только `stable` |

---

## ✅ Проверка работоспособности

### После добавления секретов:

1. Сделайте изменение в проекте
2. Закоммитьте и запушьте в ветку `stable`:
   ```bash
   git add .
   git commit -m "test: GitHub Actions setup"
   git push origin stable
   ```

3. Проверьте выполнение:
   - GitHub → **Actions**
   - Увидите запущенные workflows

### Что должно произойти:

✅ CI workflow:
- Проверка кода
- Запуск тестов  
- ✅ Статус: Success

✅ Deploy workflow (если настроен VPS):
- Сборка образов
- Публикация в Docker Hub
- Создание релиза
- Деплой на сервер
- ✅ Статус: Success

---

## 🐛 Troubleshooting

### Ошибка: "Secret not found"
- Проверьте правильность имен секретов (регистр важен!)
- Секреты должны быть в разделе **Repository secrets**, не **Environment secrets**

### Ошибка при деплое на VPS
- Проверьте SSH подключение вручную: `ssh USER@VPS_HOST`
- Убедитесь что публичный ключ добавлен в `~/.ssh/authorized_keys`
- Проверьте что ключ в base64 без переносов строк

### Ошибка Docker Hub
- Проверьте что токен активен
- Убедитесь что username написан правильно
- Токен должен иметь права Read + Write + Delete

### Backend тесты падают
- Это нормально если тестов еще нет
- Workflow помечен как `|| true` (не блокирует деплой)
- Добавьте тесты в `backend/tests/`

---

## 📦 Структура релизов

После успешного деплоя создается релиз:

```
Tag: deploy-{VERSION}-{TIMESTAMP}
Образы:
- artem1003/xatube-backend:latest
- artem1003/xatube-backend:{VERSION}
- artem1003/xatube-frontend:latest  
- artem1003/xatube-frontend:{VERSION}
```

Установка релиза на новый сервер:
```bash
docker pull artem1003/xatube-backend:latest
docker pull artem1003/xatube-frontend:latest
docker-compose up -d
```

---

## 🔐 Безопасность

- ✅ Никогда не коммитьте секреты в код
- ✅ Используйте Personal Access Tokens, не пароли
- ✅ SSH ключи только для CI/CD (отдельные от личных)
- ✅ Регулярно ротируйте токены
- ✅ Минимальные права для токенов

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи в GitHub Actions
2. Убедитесь что все секреты добавлены
3. Проверьте синтаксис YAML файлов
4. Посмотрите Issues в репозитории

Happy coding! 🚀
