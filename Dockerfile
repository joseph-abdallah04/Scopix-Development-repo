FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y \
    apt-utils curl git ca-certificates \
    sudo unzip python3 python3-pip python3-venv \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt install -y nodejs \
 && npm install -g npm \
 && npm install -g pnpm \
 && rm -rf /var/lib/apt/lists/*

ARG USERNAME=ubuntu
RUN echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER $USERNAME

RUN curl -LsSf https://astral.sh/uv/install.sh | bash
ENV PATH="/home/ubuntu/.cargo/bin:$PATH"

WORKDIR /home/$USERNAME/RNSH

CMD ["bash"]

EXPOSE 5173
