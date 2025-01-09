#!/bin/bash

# Code for Linux/Mac:
cd reader-app
npm run build
cd ..
cp -r reader-app/dist desktop-app
cp backend/backend-core.js desktop-app/backend-core.js
cd desktop-app
npm run start
cd ..