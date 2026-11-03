# PREDRIVE AI

Research MVP for a driver monitoring PWA connected to a Python backend. The current backend validates incoming frames and returns `NOT_EVALUATED` (`mock-v0`); it does not contain or run a driver-state AI model and does not store images.

## Run the project on Windows

Install backend dependencies once:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd ..
```

Install frontend dependencies once:

```powershell
cd frontend
npm.cmd ci
cd ..
```

Start both services from the project root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Open `http://127.0.0.1:5173/`. The API listens on port 8000 and the frontend connects to it using the current page hostname. To run backend checks, use `backend\.venv\Scripts\python.exe -m pytest backend\tests -q`.

## Scope and safety

This is a development prototype, not a certified driving-safety system. Test only with recorded/simulated content or consenting participants while the vehicle is stationary. Camera access on phones requires HTTPS; public deployment also requires WSS, user authentication, authorization, and appropriate privacy controls. Do not commit secrets, `.env` files, or private driver imagery.

See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), [BACKEND_CONTEXT.md](BACKEND_CONTEXT.md), [FRONTEND_CONTEXT.md](FRONTEND_CONTEXT.md), and [docs/api-contract.md](docs/api-contract.md) for project and interface details.
