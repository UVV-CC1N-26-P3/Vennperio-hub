# Vennperio Hub

Site público e feed de comunicados do Vennperio.

O conteúdo publicado em `content/announcements/` é validado e convertido para:

```text
public/api/v1/announcements.json
```

Esse endpoint pode ser consumido pelo servidor do jogo. A página `public/index.html`
serve como histórico público e página de detalhes.

## Requisitos

- Node.js 20 ou superior.

## Desenvolvimento

Valide os comunicados:

```bash
npm run check
```

Gere o feed:

```bash
npm run build
```

Para visualizar localmente, depois do build:

```bash
npx serve public
```

## Criar um comunicado

Copie um arquivo existente em `content/announcements/`, altere o `id` e preencha
os campos. Use datas ISO 8601 com fuso horário explícito:

```text
2026-07-01T22:00:00-03:00
```

Tipos aceitos:

- `development`
- `update`
- `maintenance`
- `incident`

Severidades aceitas:

- `info`
- `warning`
- `critical`

Para uma manutenção programada, preencha `startsAt` e `endsAt`. O servidor do
jogo poderá usar esses campos para exibir contagem regressiva e impedir novas
partidas próximo ao horário da atualização.

## Publicação no Cloudflare Pages

Configure o projeto com:

- Repositório: `UVV-CC1N-26-P3/Vennperio-hub`
- Branch de produção: `main`
- Comando de build: `npm run build`
- Diretório de saída: `public`
- Variável `NODE_VERSION`: `22`

O arquivo `public/_headers` libera somente leitura pública do feed e controla o
cache. O conteúdo do feed é público e não deve conter segredos.

## Endpoints

Depois da publicação:

```text
https://SEU-DOMINIO/api/v1/announcements.json
https://SEU-DOMINIO/api/announcements
```

O segundo endereço é um alias configurado em `public/_redirects`.
