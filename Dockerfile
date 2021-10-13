FROM node:16

ENV LC_ALL=C.UTF-8 \
    LANG=C.UTF-8 \
    LANGUAGE=en_US:en

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN set -x && \
    apt-get update -y && \
    apt-get install -y --no-install-recommends git make build-essential ffmpeg python3 python3-pip python3-setuptools && \
    git config --global advice.detachedHead false && \
    # Install ytdl
    python3 -m pip install --upgrade git+https://github.com/yt-dlp/yt-dlp.git@release && \
    # git clone https://github.com/yt-dlp/yt-dlp.git /src/yt-dlp && \
    # pushd /src/yt-dlp && \
    # git checkout "release" && \
    # make && \
    # make install && \
    # popd && \
    # Create /config directory
    mkdir -p /config && \
    # Clean-up.
    apt-get autoremove -y && \
    apt-get clean -y && \
    rm -rf /var/lib/apt/lists/* /tmp/* /src

# # Copy init script, set workdir & entrypoint
# COPY init /init
# WORKDIR /workdir
# ENTRYPOINT ["/init"]

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD [ "node", "index.js" ]
