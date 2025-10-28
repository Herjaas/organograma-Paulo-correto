# Organograma Interativo (React + Vite + Tailwind)

## Rodar local
```bash
npm install
npm run dev
```

## Publicar no GitHub Pages
1. Garanta que o repositório no GitHub é `Herjaas/organograma-Paulo-correto`.
2. Faça login no GitHub no terminal (ou configure token para `git push`).
3. Rode:
```bash
npm run deploy
```
Isso irá gerar a pasta `dist/` e publicar no branch `gh-pages`.
A URL ficará: https://herjaas.github.io/organograma-Paulo-correto/

> Obs.: `vite.config.js` já está com `base: '/organograma-Paulo-correto/'`.
