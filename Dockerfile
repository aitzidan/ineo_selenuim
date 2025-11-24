FROM node:18

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .

RUN apt-get update && apt-get install -y wget unzip && \
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    apt install -y ./google-chrome-stable_current_amd64.deb && \
    rm google-chrome-stable_current_amd64.deb && \
    apt-get clean
# Run the virtual framebuffer (Xvfb) for headless Chrome
RUN Xvfb :99 -ac &

CMD [ "npm", "start" ]

