# 🌐 Production Deployment Guide

This project is a full-stack Next.js + Express application backed by MongoDB (with transaction/replica-set support) and Redis (caching, rate limiting, and BullMQ worker queue).

---

## 🎯 Architecture Overview

| Component | Technology | Recommended Cloud Target |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 App Router | **Vercel** (Free / Automatic CI/CD) |
| **Backend API & Worker** | Node.js / Express TypeScript | **Render** or **Railway** |
| **Database** | MongoDB 7.0 (with Replica Set `rs0`) | **MongoDB Atlas** (Free M0 Cluster) |
| **Cache & Queue** | Redis 7 | **Upstash Redis** or **Railway Redis** |

---

## 🚀 Option 1: Managed Cloud Deployment (Recommended & Free Tier Available)

This option requires zero server maintenance, gives you automatic HTTPS, and deploys directly from your GitHub repository:
`https://github.com/Prem836/Hostel-Allocation-and-Roommate-Matching-System.git`

### Step 1: Set up Cloud MongoDB (MongoDB Atlas)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a **Free Shared Cluster (M0)** (e.g., in AWS / Region closest to you).
   > *Note: MongoDB Atlas clusters run as 3-node replica sets by default, which satisfies all transaction requirements of this application.*
3. Under **Database Access**, create a database user (e.g. `hostel_admin`) and password.
4. Under **Network Access**, add IP `0.0.0.0/0` (allow access from anywhere) so cloud servers can connect.
5. Click **Connect** → **Drivers** and copy your connection string:
   ```
   mongodb+srv://hostel_admin:<password>@cluster0.xxxxx.mongodb.net/hostel_allocation?retryWrites=true&w=majority
   ```

---

### Step 2: Set up Cloud Redis (Upstash)
1. Go to [upstash.com](https://upstash.com/) and create a free account.
2. Create a **Redis Database** (select TLS enabled).
3. Copy the **ioredis URL** / **Connection String**:
   ```
   rediss://default:<password>@<endpoint>.upstash.io:6379
   ```

---

### Step 3: Deploy Backend API on Render (or Railway)
1. Go to [render.com](https://render.com) and click **New +** → **Web Service**.
2. Connect your GitHub repository: `Prem836/Hostel-Allocation-and-Roommate-Matching-System`.
3. Configure the settings:
   * **Root Directory**: `server`
   * **Environment**: `Node`
   * **Build Command**: `npm ci && npm run build`
   * **Start Command**: `npm run start`
4. Add **Environment Variables**:
   * `NODE_ENV`: `production`
   * `PORT`: `5000`
   * `MONGODB_URI`: `<Your MongoDB Atlas Connection String from Step 1>`
   * `REDIS_URL`: `<Your Upstash Redis Connection String from Step 2>`
   * `JWT_SECRET`: `<Generate a random 32+ character string>`
   * `DATA_ENCRYPTION_KEY`: `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` (32 bytes hex)
   * `INSTITUTION_ID`: `inst_default_01`
   * `CLIENT_URL`: `https://<your-frontend-domain>.vercel.app` *(update once frontend is created)*
5. Click **Create Web Service**. Note down your backend URL (e.g. `https://hostel-api.onrender.com`).

---

### Step 4: Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New** → **Project**.
2. Import your GitHub repository: `Prem836/Hostel-Allocation-and-Roommate-Matching-System`.
3. Configure the project:
   * **Framework Preset**: `Next.js`
   * **Root Directory**: Click edit and select `client`
4. Expand **Environment Variables** and add:
   * `NEXT_PUBLIC_API_URL`: `https://<your-render-backend-url>/api/v1` (e.g. `https://hostel-api.onrender.com/api/v1`)
5. Click **Deploy**. Vercel will build the frontend and provide your live URL (e.g. `https://hostel-sync.vercel.app`).
6. Go back to Render and update `CLIENT_URL` to match your Vercel URL!

---

## 🐳 Option 2: Self-Hosted Docker Deployment (Single VPS)

If you have a Linux VPS (DigitalOcean Droplet, AWS EC2, Hetzner, Linode):

1. **Clone the repository on your server**:
   ```bash
   git clone https://github.com/Prem836/Hostel-Allocation-and-Roommate-Matching-System.git
   cd Hostel-Allocation-and-Roommate-Matching-System
   ```

2. **Configure production environment variables**:
   Create a `.env` file with your secure production values.

3. **Launch all containers**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Verify running containers**:
   ```bash
   docker ps
   ```
   This will spin up:
   * `hostel_mongo_prod` on port 27017 (with replica set `rs0` configured)
   * `hostel_redis_prod` on port 6379
   * `hostel_server_prod` on port 5000
   * `hostel_client_prod` on port 3000

5. **Set up Nginx / Caddy Reverse Proxy**:
   Point your domain to port 3000 (frontend) and proxy `/api/` to port 5000 (backend).
