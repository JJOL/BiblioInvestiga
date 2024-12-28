cd reader-app
npm run build
cd ..
cp -Recurse -Force reader-app/dist desktop-app
cd desktop-app
npm run start
cd ..