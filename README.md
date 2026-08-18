# Qual é a Palavra? (Wordle Customizado)

Jogo de adivinhação de palavras personalizável estilo Wordle em Português.

## 🚀 Como Publicar no GitHub e GitHub Pages

### Opção 1: Implantação Automática via GitHub Actions (Recomendado)

1. Crie um novo repositório no seu **GitHub** (ex: `qual-e-a-palavra`).
2. No seu computador, inicialize o Git, conecte ao seu repositório remoto e faça o push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/qual-e-a-palavra.git
   git push -u origin main
   ```
3. No seu repositório no GitHub:
   - Vá em **Settings** > **Pages**.
   - Em **Source**, selecione **GitHub Actions**.
4. Pronto! Cada `git push` na branch `main` irá compilar e publicar automaticamente seu jogo no GitHub Pages.

---

### Opção 2: Implantação Manual via Terminal (`npm run deploy`)

1. Adicione o seu repositório remoto no Git:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/qual-e-a-palavra.git
   ```
2. Execute o comando de deploy no terminal:
   ```bash
   npm run deploy
   ```
3. No GitHub:
   - Vá em **Settings** > **Pages**.
   - Em **Source**, selecione **Deploy from a branch** e escolha a branch `gh-pages` / `/ (root)`.

---

## 🛠️ Tecnologias Utilizadas

- **React 19**
- **Vite**
- **Tailwind CSS v4**
- **Lucide Icons** & **Canvas Confetti**
- **TypeScript**
