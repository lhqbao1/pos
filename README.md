# POS Monorepo

Project này là monorepo:

- `.`: Next.js app (repo `pos`)
- `./pos-strapi`: Strapi CMS code (repo `pos-strapi`)

## Chạy local

### Frontend (Next.js)

```bash
cd /Users/bao/websites/pos
npm run dev
```

### Strapi CMS

```bash
cd /Users/bao/websites/pos/pos-strapi
npm run develop
```

## Push code trong monorepo

### Push repo `pos` (frontend + toàn monorepo)

```bash
cd /Users/bao/websites/pos
git add .
git commit -m "your message"
git push origin main
```

### Push riêng code Strapi lên repo `pos-strapi`

```bash
cd /Users/bao/websites/pos
git add pos-strapi
git commit -m "chore(strapi): update cms"
git subtree push --prefix pos-strapi strapi main
```

### Nếu bị lỗi `non-fast-forward` khi push `subtree`

```bash
cd /Users/bao/websites/pos
git subtree pull --prefix pos-strapi strapi main --squash
git subtree push --prefix pos-strapi strapi main
```

## Kiểm tra remote

```bash
cd /Users/bao/websites/pos
git remote -v
```

Kỳ vọng:

- `origin` -> `https://github.com/lhqbao1/pos.git`
- `strapi` -> `https://github.com/lhqbao1/pos-strapi.git`

