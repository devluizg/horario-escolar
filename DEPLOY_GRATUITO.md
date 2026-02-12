# Deploy Gratuito com Sincronização Diária

Este projeto agora suporta:
- `localStorage` (offline/local)
- sincronização em nuvem (Supabase grátis)

Assim, depois da primeira migração, o horário fica salvo na hospedagem e continua disponível todos os dias.

## 1) Migrar os dados que você já cadastrou

Como seu uso atual está em `file:///...`, o navegador considera outro domínio.
Por segurança, ele **não transfere automaticamente** esse `localStorage` para a hospedagem.

Faça 1 vez:
1. Abra seu projeto local (como você já usa hoje).
2. Clique em `💾 Exportar JSON`.
3. Guarde o arquivo de backup.

## 2) Criar banco grátis no Supabase

1. Crie conta em `https://supabase.com`.
2. Crie um projeto.
3. No SQL Editor, execute:

```sql
create table if not exists public.school_schedules (
  school_id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.school_schedules enable row level security;

create policy "anon_read_write_school_schedules"
on public.school_schedules
for all
to anon
using (true)
with check (true);
```

## 3) Configurar no projeto

Edite `config.js`:

```js
const cloudSyncConfig = {
    enabled: true,
    provider: 'supabase',
    supabaseUrl: 'https://SEU-PROJETO.supabase.co',
    supabaseAnonKey: 'SUA_ANON_KEY',
    table: 'school_schedules',
    schoolId: 'escola_padrao',
    autoSync: true,
    syncOnLoad: true,
    debounceMs: 1200
};
```

Valores:
- `supabaseUrl` e `supabaseAnonKey`: Settings > API no Supabase.
- `schoolId`: identificador da sua escola (use algo único, ex.: `escola_joao_2026`).

## 4) Deploy no GitHub Pages (grátis)

1. Crie um repositório no GitHub.
2. Suba estes arquivos do projeto.
3. No GitHub: `Settings > Pages`.
4. Em `Build and deployment`, selecione:
   - `Source: Deploy from a branch`
   - `Branch: main` (ou `master`) e `/ (root)`
5. Salve e aguarde a URL pública.

## 5) Primeira carga na hospedagem

1. Abra a URL hospedada.
2. Clique em `📂 Importar JSON` e escolha o backup exportado no passo 1.
3. Clique em `☁️ Sincronizar Agora`.

Pronto: daqui em diante, toda alteração salva também na nuvem automaticamente.

