FROM node:20-alpine AS frontend-build

WORKDIR /frontend

COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml frontend/index.html frontend/vite.config.js ./
COPY frontend/src ./src
RUN corepack enable && pnpm install --frozen-lockfile

RUN node ./node_modules/vite/bin/vite.js build

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
COPY --from=frontend-build /static ./static

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "api:app"]
