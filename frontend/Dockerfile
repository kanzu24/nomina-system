# Stage 1: Build
FROM node:18.19.1-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Limpiar caché e instalar dependencias
RUN npm cache clean --force && \
    npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build para producción
RUN npm run build:prod

# Stage 2: Serve
FROM nginx:1.25-alpine

# Copiar archivos compilados
COPY --from=build /app/dist/nomina-system-frontend /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]