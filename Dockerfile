
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    curl wget git build-essential ca-certificates \
    sudo unzip python3 python3-pip python3-venv \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y nodejs \
 && npm install -g pnpm \
 && rm -rf /var/lib/apt/lists/*


ARG USERNAME=dev
ARG USER_UID=1001
ARG USER_GID=$USER_UID

RUN groupadd -g $USER_GID $USERNAME \
 && useradd -m -u $USER_UID -g $USER_GID $USERNAME \
 && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER $USERNAME

RUN curl -LsSf https://astral.sh/uv/install.sh | bash
ENV PATH="/home/dev/.cargo/bin:$PATH"

WORKDIR /home/$USERNAME/RNSH

CMD ["bash"]
