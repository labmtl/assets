# Setup Instructions

This document explains how to set up the LabMTL Assets pipeline for both GitHub Actions and local development.

## 1. OVHcloud AI Endpoints Setup

To use the AI-powered description features, you need an OVHcloud AI Endpoints token.

### Create an OVHcloud AI Token
1.  Log in to the [OVHcloud Control Panel](https://www.ovh.com/manager/).
2.  Go to **Public Cloud** and select your project.
3.  In the left sidebar, go to **AI & Machine Learning** > **AI Endpoints**.
4.  Click on **API Tokens** and create a new token (e.g., "Assets Processing").
5.  **Copy the token value**.

### Configure GitHub Secrets
Add the token to your repository secrets:
- Name: `OVH_AI_TOKEN`
- Value: `[Your OVH AI Token]`

## 2. Local Environment Setup

This project uses **Nix** and **direnv** to manage its development environment.

### Prerequisites
1.  Install [Nix](https://nixos.org/download.html).
2.  Install [direnv](https://direnv.net/).
3.  Allow the environment:
    ```bash
    direnv allow
    ```

### Secrets Management (SOPS)
The environment is configured to automatically load secrets from a SOPS-encrypted `.env` file.
1.  Create a `.env` file with your token:
    ```bash
    OVH_AI_TOKEN="your_token_here"
    ```
2.  Encrypt it with SOPS (optional but recommended for security):
    ```bash
    sops -e .env > .env.tmp && mv .env.tmp .env
    ```
3.  When you enter the directory or run `nix develop`, the token will be automatically exported.

## Supported Models
The pipeline is optimized for **`Qwen2.5-VL-72B-Instruct`**, which supports multi-modal analysis (images and video frames).
