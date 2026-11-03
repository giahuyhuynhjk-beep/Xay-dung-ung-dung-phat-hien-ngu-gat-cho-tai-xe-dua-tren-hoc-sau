$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$backendRoot = Join-Path $projectRoot 'backend'
$frontendRoot = Join-Path $projectRoot 'frontend'
$python = Join-Path $backendRoot '.venv\Scripts\python.exe'
$vite = Join-Path $frontendRoot 'node_modules\vite\bin\vite.js'
$node = (Get-Command node.exe -ErrorAction Stop).Source

if (-not (Test-Path -LiteralPath $python)) {
    throw 'Backend environment not found. Create it with: cd backend; python -m venv .venv; .\.venv\Scripts\python.exe -m pip install -r requirements.txt'
}
if (-not (Test-Path -LiteralPath $vite)) {
    throw 'Frontend dependencies not found. Install them with: cd frontend; npm.cmd ci'
}

$backendListening = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $backendListening) {
    Start-Process -FilePath $python -ArgumentList '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000' `
        -WorkingDirectory $backendRoot -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $env:TEMP 'predrive-backend.out.log') `
        -RedirectStandardError (Join-Path $env:TEMP 'predrive-backend.err.log') | Out-Null
}

$frontendListening = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $frontendListening) {
    Start-Process -FilePath $node -ArgumentList $vite, '--host', '127.0.0.1', '--port', '5173' `
        -WorkingDirectory $frontendRoot -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $env:TEMP 'predrive-frontend.out.log') `
        -RedirectStandardError (Join-Path $env:TEMP 'predrive-frontend.err.log') | Out-Null
}

$deadline = (Get-Date).AddSeconds(20)
do {
    Start-Sleep -Milliseconds 500
    try {
        $api = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/health' -TimeoutSec 2
        $page = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/' -TimeoutSec 2 -UseBasicParsing
        if ($api.status -eq 'ok' -and $page.StatusCode -eq 200) {
            Write-Output 'PREDRIVE AI is running:'
            Write-Output '  Frontend: http://127.0.0.1:5173/'
            Write-Output '  Backend:  http://127.0.0.1:8000/health'
            Write-Output '  WebSocket: ws://127.0.0.1:8000/ws/monitor?session_id=<session UUID>'
            exit 0
        }
    } catch {
        # Wait briefly for both local development servers to start.
    }
} while ((Get-Date) -lt $deadline)

throw 'One or more services did not start. Check %TEMP%\predrive-backend.err.log and %TEMP%\predrive-frontend.err.log.'
