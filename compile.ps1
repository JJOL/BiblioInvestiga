cd reader-app
npm run build
cd ..
cp -Recurse -Force reader-app/dist desktop-app
cp backend/backend-core.js desktop-app/backend-core.js
cd desktop-app
npm run start
cd ..