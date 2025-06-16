# xxx
for **macos** user, once you pull from the repo you need execute this command to start the development:
## this is for the frontend dev:
```bash
docker run -it --rm \
  -p 5173:5173 \
  -v "$(pwd)":/home/ubuntu/RNSH \
  rnsh-dev \
  bash -c "
    cd /home/ubuntu/RNSH &&
    pnpm install &&
    pnpm run dev"
```
## this is for the frontend dev:

```bash
docker run -it --rm \
  -p 5173:5173 \
  -v "$(pwd)":/home/ubuntu/RNSH \
  rnsh-dev \
  bash -c "
    cd /home/ubuntu/RNSH &&
    source .venv/bin/activate &&
    uv sync"
```

for **windows** user, once you pull from the repo you need execute this command to start the development:
## this is for the frontend dev:

```powershell
docker run -it --rm `
  -p 5173:5173 `
  -v "${PWD}:/home/ubuntu/RNSH" `
  rnsh-dev `
  bash -c "
    cd /home/ubuntu/RNSH &&
    pnpm install &&
    pnpm run dev"
```
## this is for the frontend dev:

```powershell
docker run -it --rm `
  -p 5173:5173 `
  -v "${PWD}:/home/ubuntu/RNSH" `
  rnsh-dev `
  bash -c "
    cd /home/ubuntu/RNSH &&
    source .venv/bin/activate &&
    uv sync"
```
