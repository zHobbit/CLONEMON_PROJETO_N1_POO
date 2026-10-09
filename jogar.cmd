@echo off
rem Sobe o CLONEMON (jogo + API + banco) com Docker e abre no navegador.
cd /d "%~dp0"

docker version >nul 2>&1
if errorlevel 1 (
  echo O Docker nao esta rodando. Abra o Docker Desktop e tente de novo.
  pause
  exit /b 1
)

echo Subindo o CLONEMON. Na primeira vez o build demora alguns minutos...
docker compose --profile app up -d --build
if errorlevel 1 (
  echo Nao foi possivel subir os containers.
  pause
  exit /b 1
)

echo Esperando o jogo ficar pronto...
powershell -NoProfile -Command "$d = (Get-Date).AddMinutes(3); while ((Get-Date) -lt $d) { try { if ((Invoke-WebRequest -UseBasicParsing 'http://localhost:8081/api/species' -TimeoutSec 3).StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep 2 }; exit 1"
if errorlevel 1 (
  echo O jogo nao respondeu a tempo. Veja os logs com: docker compose --profile app logs app
  pause
  exit /b 1
)

start "" http://localhost:8081
echo.
echo CLONEMON aberto em http://localhost:8081
echo Para desligar: docker compose --profile app down
pause
