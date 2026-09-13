# CAETANO IMPORTZ — loja online

Loja própria em **Next.js 16 + Prisma 7 + PostgreSQL (Neon)**, pensada primeiro para telemóvel (o público chega pelo Instagram).
Fase 1 (MVP) concluída: homepage, catálogo com filtros, página de produto com stock por tamanho,
carrinho, checkout, compra por WhatsApp, contas de cliente, painel de administração, stock, encomendas e SEO técnico.

> **Regra de ouro:** o site nunca inventa dados. Produtos, preços, stock, marcas, contactos, NIF,
> políticas e avaliações entram **só pelo admin**. O que está vazio não aparece na loja.

---

## 1. Instalar e correr localmente

Requisitos: Node 24 e npm 11. Não é preciso Docker (o Postgres local vem como dependência npm).

```bash
npm install
cp .env.example .env        # e preencher SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
npm run db:start            # Postgres local na porta 5434 (deixar este terminal aberto)
npx prisma migrate deploy   # noutro terminal: cria as tabelas
npm run db:seed             # categorias base, definições, páginas legais vazias e conta ADMIN
npm run dev                 # http://localhost:3000
```

Comandos úteis: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run db:studio` (ver o banco),
`npm run db:migrate` (criar uma migração nova depois de mudar `prisma/schema.prisma`).

## 2. Variáveis de ambiente

Ver `.env.example` (comentado). Resumo:

| Variável | Para quê | Obrigatória |
|---|---|---|
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Banco. Na Vercel são criadas sozinhas pelo Neon | Sim |
| `NEXT_PUBLIC_SITE_URL` | URL pública (SEO, sitemap, links) | Sim, em produção |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` | Primeira conta ADMIN (só é criada se não existir) | No 1.º deploy |
| `BLOB_READ_WRITE_TOKEN` | Upload de imagens (Vercel Blob) | Sim, em produção |
| `IFTHENPAY_*` | Pagamentos MB WAY / Multibanco / cartão (Fase 2) | Não |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | Analytics (só carregam com consentimento) | Não |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Verificação do Search Console | Não |

Nunca pôr valores fictícios: vazio = funcionalidade desligada.

## 3. Banco de dados

- Esquema: `prisma/schema.prisma` (dinheiro sempre em **cêntimos**, `Int`).
- Migrações: `prisma/migrations/`. **No deploy de produção correm sozinhas** (`prisma/preparar-banco.mjs`,
  chamado pelo `vercel.json`), seguidas do seed idempotente. Se a migração falhar, o build pára e a Vercel
  mantém a versão anterior no ar.
- Entidades: User, Session, Address, Category (árvore), Brand, Product, ProductImage, ProductVariant
  (stock por tamanho/cor), InventoryMovement (histórico de stock), Order, OrderItem, Payment,
  OrderStatusHistory, Coupon, Drop, DropProduct, WishlistItem, Review, StockAlert, ShippingMethod,
  StoreSettings, LegalPage.

## 4. Deploy (GitHub → Vercel → Neon → Blob → domínio)

1. Repositório no GitHub (público) e `git push`.
2. Vercel → *Add New Project* → importar o repositório. O `vercel.json` já define o build e a região
   `fra1` (Frankfurt, a mais próxima de Portugal).
3. Vercel → projeto → **Storage → Create Database → Neon** → ligar ao projeto (cria `DATABASE_URL`).
4. Vercel → projeto → **Storage → Create → Blob** → ligar ao projeto (cria `BLOB_READ_WRITE_TOKEN`).
5. *Settings → Environment Variables*: `NEXT_PUBLIC_SITE_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.
6. *Deployments → Redeploy*. Confirmar abrindo mesmo o site (READY só quer dizer que compilou).
7. Depois do primeiro login, **mudar a palavra-passe** e apagar `SEED_ADMIN_PASSWORD` das variáveis.

> Uso comercial exige o plano **Vercel Pro** (o Hobby é só para projetos pessoais).

### Domínio próprio
Vercel → projeto → *Settings → Domains* → adicionar o domínio e criar os registos DNS indicados
(A/CNAME no registador). Atualizar `NEXT_PUBLIC_SITE_URL` para o domínio final e fazer redeploy.

## 5. Imagens

- Produção: **Vercel Blob**. O admin reduz as fotos no browser (máx. 2000 px, WebP) antes de enviar;
  o `next/image` serve AVIF/WebP no tamanho certo para cada ecrã.
- Desenvolvimento sem token: ficam em `public/uploads/` (fora do git). Nota: `next start` só serve
  ficheiros que já existiam em `public/` no momento do build — para testar uploads localmente usar `npm run dev`.
- Para mudar para Cloudflare R2 no futuro, basta reescrever `src/lib/storage.ts`.

## 6. Pagamentos

Estado atual (Fase 1): o checkout regista a encomenda como **Pagamento pendente** e o cliente
envia-a pelo WhatsApp para combinar o pagamento. MB WAY, Multibanco e cartão aparecem como
“Brevemente”. **Nenhum pagamento é simulado.**

Gateway recomendado: **ifthenpay** (MB WAY 0,07 € + 0,7%; Multibanco e cartão 0,20 € + 1,5%; sem mensalidade; + IVA).
Exige atividade aberta nas Finanças (ENI ou empresa). Para ativar (Fase 2):

1. Contrato com a ifthenpay e chaves nas variáveis `IFTHENPAY_*`.
2. Implementar o adaptador em `src/lib/payments.ts` e o callback em `src/app/api/payments/ifthenpay/route.ts`
   (validar a chave anti-phishing e chamar `changeOrderStatus` com `PAID`).
3. Marcar os métodos em Admin → Definições → Pagamentos.

⚠️ Todos os gateways (ifthenpay, Stripe, SIBS, Shopify Payments) proíbem réplicas e contrafação. Só vender
produtos com origem legal comprovada.

## 7. Admin

Entrar em `/login` com a conta ADMIN → `/admin`.

| Papel | Pode |
|---|---|
| **ADMIN** | Tudo: produtos, stock, encomendas, categorias, clientes, equipa, definições |
| **STAFF** | Produtos, stock, categorias/marcas e encomendas — sem clientes, equipa nem definições |

A proteção é feita no servidor, em cada página e em cada ação (não basta esconder o menu).

### Primeiros passos no admin
1. **Definições**: WhatsApp (ativa o botão flutuante e “Comprar pelo WhatsApp”), e-mail, redes sociais,
   nome legal, NIF, entidade RAL, textos de confiança **verdadeiros**, logótipo, imagem do hero.
2. **Definições → Métodos de envio**: transportadora, preço, países, “grátis acima de”, prazo.
3. **Definições → Páginas legais**: termos, privacidade, cookies, trocas/devoluções, envios (texto revisto pela empresa).
4. **Categorias e marcas**: ajustar as categorias base e criar as marcas reais.
5. **Produtos → Novo produto**.

### Como adicionar um produto
1. Nome, descrição, preço (ex.: `79,90`) e, se houver, preço promocional.
2. Fotos (a primeira é a principal; reordenar com as setas; preencher o texto alternativo).
3. Variantes: escolher um conjunto de tamanhos (Roupa XS–XXL, Calçado 36–45, …), opcionalmente com cor,
   e indicar o **stock de cada tamanho**.
4. Categoria, marca e etiquetas (Novidade, Destaque, Mais vendido, Limitado).
5. Campos de importação (origem, modelo, coleção, edição). **Autenticidade** só aparece na loja se a caixa
   de confirmação estiver marcada — e só com prova (fatura de fornecedor autorizado).
6. Estado **Publicado** → Guardar. A loja atualiza logo.

### Encomendas e stock
- Estados: Pendente → Pagamento pendente → Pago → Em preparação → Enviado → Entregue (ou Cancelado / Reembolsado).
- **O stock só desce quando a encomenda passa a Pago** (ou seguinte). Se entretanto esgotou, a confirmação falha
  com aviso — nunca fica stock negativo. Cancelar ou reembolsar devolve o stock.
- Todas as mudanças de stock ficam registadas (Admin → Stock → Movimentos recentes).

## 8. SEO e analytics

- Já implementado: metadata e Open Graph por página, URLs amigáveis, canonical, `sitemap.xml`, `robots.txt`,
  JSON-LD `Product`, `Organization` e `BreadcrumbList`; páginas com filtros ficam `noindex`.
- **Search Console**: adicionar a propriedade do domínio, colar o código em `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`,
  redeploy, verificar e submeter `https://<domínio>/sitemap.xml`.
- **GA4 / GTM / Meta Pixel**: preencher os IDs reais. Só carregam depois de o visitante aceitar cookies (RGPD).
- Palavras-chave a trabalhar nas descrições de categoria: “camisolas de futebol”, “camisola Portugal 2026”,
  “camisolas retro”, “camisola personalizada”, “streetwear Portugal/Lisboa”, “sneakers Portugal”,
  “roupa importada”. Validar volumes no Search Console depois do lançamento.

## 9. Segurança

Argon2id nas palavras-passe, sessões com token opaco (hash SHA-256) em cookie httpOnly, bloqueio após 5
tentativas falhadas, limite de pedidos em login/registo/checkout, validação Zod em todas as ações, preços
sempre recalculados no servidor, proteção contra redirecionamentos abertos e cabeçalhos de segurança
(`X-Frame-Options`, `nosniff`, `Referrer-Policy`). Nenhum segredo vai para o browser.

Limitação conhecida: o limite de pedidos é em memória, por instância. Com mais tráfego, trocar por Upstash Redis.

## 10. Roadmap

- **Fase 2**: ifthenpay (MB WAY, Multibanco, cartão), cupões (modelo pronto), avaliações de compras verificadas
  (modelo pronto), drops com contagem regressiva (modelo pronto), “avisa-me quando voltar” (modelo pronto),
  e-mails transacionais, personalização nome/número em camisolas.
- **Fase 3**: fidelização (só se a recompra justificar), recuperação de carrinho, WhatsApp marketing,
  recomendações, preços em BRL para o Brasil.

## Estrutura

```
prisma/                 schema, migrações, seed, preparar-banco (build Vercel)
scripts/dev-db.mjs      Postgres local
src/app/(loja)/         loja pública, conta, checkout
src/app/admin/          painel de administração
src/app/api/            carrinho, favoritos, produtos por id
src/components/         layout, produto, catálogo, UI
src/lib/                auth, catálogo, encomendas/stock, pagamentos, storage, definições
src/proxy.ts            primeira barreira + cabeçalhos de segurança
```
