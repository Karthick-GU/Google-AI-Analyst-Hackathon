FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Install serve to run the built app
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 3000

# Command to serve the built application
CMD ["serve", "-s", "dist", "-l", "3000"]