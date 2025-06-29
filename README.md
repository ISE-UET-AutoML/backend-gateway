# Backend Gateway Service

# Hướng dẫn
## Thiết lập env
Copy từ file env.example:
- `USER_NAME`: tên của mình
- `*_SERVICE_URL`: domain của các services

## Thiết lập proxy
Vào file `src/config/index.js`.
Ở phần services, thay thế `pathRewrite` thành base path tương ứng với từng service

**Ví dụ:**

User service có endpoint path là `http://localhost:10458/{BASE_PATH}` thì thêm đoạn này vào trong file:
```js
users: {
    target: process.env.USER_SERVICE_URL || 'http://localhost:10458',
        pathRewrite: {
            '^/api/service/users': '/BASE_PATH'
        },
    },
```

Lúc này muốn check API thì gọi `http://localhost:3000/api/service/{service}/*`.

**Ví dụ:**

Thay vì gọi trực tiếp tới `http://localhost:10458/users/login`

Sau khi thiết lập proxy thì gọi `http://locahost:3000/api/service/users/login`

## Authenticate
**Nếu cần bypass authenticate:**
Tạo excludeList tương ứng với service ở `src/config/index.js`. Ví dụ:
```js
services: {
    ...,
    users: {
      ...,
      excludeList: ['/login', '/register', '/saveRefreshToken']
    },
    ...
}
```
- Nếu cần bypass ở aggregation XXX thì tạo excludeList tương ứng với service ở `src/services/xxx/config.js`


## Aggregation (optional)
Nếu cần gọi tới nhiều endpoints ở nhiều service:
- Tạo folder `XXX` ở trong src/services
- Viết file config.js (optional)
- Tạo các file controller của `XXX`, file index.js chứa các routes
- Muốn check API thì gọi `http://localhost:3000/api/XXX`
- Lưu ý: Trong controller dùng proxy để gọi tới các services liên quan và tổng hợp dữ liệu. Không gọi trực tiếp URL của service.

## Chạy ##
```bash
npm install
docker compose up -d
npm run dev
```

Chạy user_service, tạo user bằng cách POST `http://localhost:3000/api/users/register`.

```json
{
  "email": "username@gmail.com",
  "password": "password",
  "full_name": "me"
}
```

Đăng nhập bằng cách POST `http:localhost:3000/api/users/login`, gửi body json tương tự như trên.

Copy `accessToken` và `user.id`, đưa vào headers:

```
x-user-id: {user.id}
Authorization: <Bearer> {accessToken}
```

## Overview
Backend Gateway Service is a robust API gateway that serves as the entry point for all client requests to our microservices architecture. It handles request routing, authentication, rate limiting, and other cross-cutting concerns.

## Features
- 🔐 Authentication & Authorization
- 🚦 Request Routing
- ⚡ Rate Limiting
- 🔄 Load Balancing
- 📝 Request/Response Logging
- 🔒 SSL/TLS Termination
- 🛡️ Security Headers
- 📊 Health Checks

## Tech Stack
- Node.js
- Express.js
- TypeScript
- Docker
- Kubernetes (for deployment)

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Docker (for containerization)
- Kubernetes cluster (for deployment)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/backend-gateway.git
cd backend-gateway
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration.

## Development

Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Building

Build the application:
```bash
npm run build
# or
yarn build
```

## Docker

Build the Docker image:
```bash
docker build -t backend-gateway .
```

Run the container:
```bash
docker run -p 3000:3000 backend-gateway
```

## API Documentation

API documentation is available at `/api-docs` when running the server.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `LOG_LEVEL` | Logging level | info |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@your-org.com or join our Slack channel.

## Authors

- Your Name - Initial work - [YourGithub](https://github.com/yourusername)

## Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community 