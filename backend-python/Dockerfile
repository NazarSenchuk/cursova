FROM python:3.12-slim-trixie
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
# Copy the project into the image
RUN apt-get update && apt-get install libgl1 libglib2.0-0 -y
ADD . /app

# Sync the project into a new environment, asserting the lockfile is up to date
WORKDIR /app
RUN uv sync --locked
ENV PYTHONUNBUFFERED=1
CMD ["uv", "run", "python", "-u", "main.py"]