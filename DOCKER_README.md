# Manoir Oublié - Docker Setup

This project includes Docker configuration for both frontend and backend services.

## Quick Start

### Using Docker Compose (Recommended)

1. **Start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MySQL: localhost:3306

3. **Stop all services:**
   ```bash
   docker-compose down
   ```

### Individual Docker Commands

#### Backend
```bash
cd ManoirOublié/manoir-backend
docker build -t manoir-backend .
docker run -p 5000:5000 manoir-backend
```

#### Frontend
```bash
cd ManoirOublié/Frontend
docker build -t manoir-frontend .
docker run -p 3000:3000 manoir-frontend
```

## Environment Variables

### Backend
- `PORT`: Server port (default: 5000)
- `CORS_ORIGINS`: Allowed CORS origins (default: http://localhost:3000)
- `MYSQL_HOST`: MySQL host (default: mysql)
- `MYSQL_USER`: MySQL username (default: root)
- `MYSQL_PASSWORD`: MySQL password (default: password)
- `MYSQL_DATABASE`: Database name (default: manoir_oublie)

### Frontend
- `VITE_API_URL`: Backend API URL (default: http://localhost:5000)

## Database

The MySQL database is automatically created with the necessary tables when the backend starts. The database data is persisted in a Docker volume named `mysql_data`.

## Development

For development, you can run the services individually:

1. **Start MySQL:**
   ```bash
   docker-compose up mysql
   ```

2. **Run backend locally:**
   ```bash
   cd ManoirOublié/manoir-backend
   pip install -r requirements.txt
   python app.py
   ```

3. **Run frontend locally:**
   ```bash
   cd ManoirOublié/Frontend
   npm install
   npm run dev
   ```

## Troubleshooting

- If you get port conflicts, modify the ports in `docker-compose.yml`
- To reset the database, run `docker-compose down -v` (this will delete all data)
- Check logs with `docker-compose logs [service-name]`
