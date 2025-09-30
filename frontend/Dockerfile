# 推荐用于 Next.js 前端生产部署的 Dockerfile

# 1. 使用官方 Node 镜像（建议 Node 18 或更高）
FROM node:20-alpine AS builder

WORKDIR /app

# 2. 安装依赖
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile

# 3. 拷贝全部源码
COPY . .

# 4. 构建 Next.js 生产包
RUN npm run build

# 5. 生产环境镜像，减小体积
FROM node:18-alpine AS runner
WORKDIR /app

# 只拷贝必要文件
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/tailwind.config.js ./tailwind.config.js
COPY --from=builder /app/postcss.config.js ./postcss.config.js

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
