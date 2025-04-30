# Use the official Node.js image as a base
FROM node:18-buster

# Install ffmpeg and opus
RUN apt-get update && \
    apt-get install -y ffmpeg libopus-dev && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json for npm installation
COPY package*.json ./

# Install dependencies including dev dependencies
RUN npm install

# Copy the rest of your project files into the container
COPY . .

# Command to run in development
CMD ["npm", "run", "dev"]
