rmdir /s /q .webpack
rmdir /s /q dist
rmdir /s /q out

REM npm start
npm run postinstall
npm run make
npm run dist
