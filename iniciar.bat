taskkill /F /IM node.exe 2>nul
timeout /t 2
start "" /D "C:\Users\PC\Desktop\ERPfutbol" cmd /c "node api\index.js"
timeout /t 3
start "" /D "C:\Users\PC\Desktop\ERPfutbol\frontend" cmd /c "npx vite --host"
