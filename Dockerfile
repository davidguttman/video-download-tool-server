FROM node:20

ENV LC_ALL=C.UTF-8 \
    LANG=C.UTF-8 \
    LANGUAGE=en_US:en

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN set -x && \
    apt-get update -y && \
    apt-get install -y --no-install-recommends git make build-essential ffmpeg wget python3 python3-pip python3-setuptools && \
    git config --global advice.detachedHead false && \
    wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp && \
    chmod a+rx yt-dlp && \
    mv yt-dlp /usr/local/bin/ && \
    apt-get autoremove -y && \
    apt-get clean -y && \
    rm -rf /var/lib/apt/lists/* /tmp/* /src

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD [ "node", "index.js" ]
