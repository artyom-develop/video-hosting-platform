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

## Workflows описание

### 1. **CI - Tests & Build** (`ci.yml`)
Запускается на push/PR для всех веток (main, develop, stable, feature/*)

**Этапы:**
- ✅ Backend Lint (black, isort, flake8)
- ✅ Backend Unit Tests (pytest с coverage)
- ✅ Frontend Lint (ESLint, Prettier)
- ✅ Frontend Unit Tests & Build
- ✅ Docker Build (без push на другие ветки)
- ✅ Generate Test Report

**Выводит:** 
- Результаты в GitHub Actions
- Текстовый отчет в артифактах (скачать можно на странице Actions)

**Как смотреть результаты:**
1. Перейди в репо → Actions
2. Выбери последний run
3. Внизу страницы найди "Artifacts"
4. Скачай `test-report` - это текстовый файл с результатами

### 2. **Deploy to Production** (`deploy-production.yml`)
Запускается только на push в ветку `stable`

**Действия:**
- Сборка и push Docker образов в Docker Hub
- Создание GitHub Release
- Генерация отчета о деплойменте

**Теги образов:**
- `latest`
- `production`
- `{version}` (из git tag или SHA)

**Как смотреть результаты:**
1. Перейди в Actions → выбери "Deploy to Production" run
2. Скачай `deployment-report` из артифактов

## Что находится в отчетах

### test-report.txt
```
✓ Backend Lint:            success/failure/skipped
✓ Backend Tests:           success/failure/skipped
✓ Frontend Lint:           success/failure/skipped
✓ Frontend Tests:          success/failure/skipped
✓ Docker Build:            success/failure/skipped

✅ ALL TESTS PASSED - READY FOR DEPLOYMENT
или
❌ SOME TESTS FAILED - REVIEW REQUIRED
```

### deployment-report.txt
```
Version: v1.0.0
Docker Images:
  📦 Backend:  user/xatube-backend:v1.0.0
  📦 Frontend: user/xatube-frontend:v1.0.0
```

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

### Docker push fails
1. Проверьте DOCKERHUB_USERNAME и DOCKERHUB_TOKEN в Settings
2. Убедитесь, что token имеет права на push
3. Проверьте имя репозитория в docker-compose файлах

### Tests не запускаются
1. Убедитесь, что есть тестовые файлы (`test_*.py`, `*.test.js`)
2. Проверьте dependencies в requirements.txt и package.json
3. Посмотрите логи в GitHub Actions для деталей ошибки

### Отчет не появляется
1. Подождите пока workflow завершится
2. Проверьте вкладку "Artifacts" на странице run
3. Убедитесь, что все jobs завершились (статус success/failure)
