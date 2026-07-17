-- ═══════════════════════════════════════════════════════════════════════════
-- Automatisation client + facture (triggers Postgres)
-- Fonctionne quelle que soit l'origine de la commande (app, mobile, import…).
--
--  AFTER INSERT ON orders :
--    1. Rattache la commande à un client (recherche par téléphone ; création
--       si absent). N'agit QUE si orders.client_id est vide → pas de doublon
--       avec la création client déjà faite côté frontend.
--    2. Génère une facture liée (from_order_id) si aucune n'existe encore.
--       Statut = 'payée' si la commande est déjà 'livrée', sinon 'attente'.
--
--  AFTER UPDATE ON orders (status → 'livrée') :
--    Passe la facture liée en 'payée' (la crée en payée si absente).
--
-- Fonctions SECURITY DEFINER (owner postgres) → contournent RLS proprement.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Helper : crée la facture liée seulement si aucune n'existe ───────────────
create or replace function public.gc_create_invoice_if_missing(o public.orders, inv_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.invoices where from_order_id = o.id) then
    return;
  end if;

  insert into public.invoices (
    id, client, client_id, phone, shop, shop_id,
    line_items, items, total, net, status, note,
    adresse_livraison, frais_livraison, frais_installation, frais_service,
    from_order_id, date, created_at
  ) values (
    '#F-' || upper(substr(md5(random()::text), 1, 6)),
    o.client, nullif(o.client_id, ''), o.phone, o.shop, o.shop_id,
    o.line_items, o.items, o.total, o.net, inv_status, o.note,
    o.adresse_livraison, o.frais_livraison, o.frais_installation, o.frais_service,
    o.id, o.date, now()
  );
end;
$$;

-- ── Trigger AFTER INSERT : rattachement client + facture en attente ──────────
create or replace function public.gc_orders_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id     text;
  v_phone         text;
  v_phone_digits  text;
begin
  -- 1) Rattachement client (uniquement si non déjà relié côté frontend)
  if coalesce(new.client_id, '') = '' then
    v_phone := nullif(btrim(coalesce(new.phone, '')), '');

    if v_phone is not null then
      v_phone_digits := regexp_replace(v_phone, '\D', '', 'g');
      if length(v_phone_digits) >= 6 then
        -- match sur les 9 derniers chiffres (gère préfixes +221, espaces…)
        select id into v_client_id
        from public.clients
        where length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) >= 6
          and right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 9)
              = right(v_phone_digits, 9)
        limit 1;
      end if;
    end if;

    -- Pas trouvé → création du client depuis les données de la commande
    if v_client_id is null and coalesce(btrim(new.client), '') <> '' then
      v_client_id := substr(md5(random()::text), 1, 8);
      insert into public.clients (id, name, phone, type, address, orders, total, created_at)
      values (
        v_client_id, btrim(new.client), coalesce(v_phone, ''),
        'nouveau', coalesce(new.adresse_livraison, ''), 0, 0, now()
      );
    end if;

    -- Lier la commande au client résolu
    if v_client_id is not null then
      update public.orders set client_id = v_client_id where id = new.id;
    end if;
  end if;

  -- 2) Facture liée (idempotent)
  perform public.gc_create_invoice_if_missing(
    new,
    case when new.status = 'livrée' then 'payée' else 'attente' end
  );

  return null;
end;
$$;

-- ── Trigger AFTER UPDATE : commande livrée → facture payée ───────────────────
create or replace function public.gc_orders_after_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Crée la facture en payée si elle manque (commande antérieure aux triggers)
  perform public.gc_create_invoice_if_missing(new, 'payée');
  -- Passe la facture liée en payée
  update public.invoices
     set status = 'payée'
   where from_order_id = new.id
     and status is distinct from 'payée';
  return null;
end;
$$;

-- ── Attache des triggers ─────────────────────────────────────────────────────
drop trigger if exists trg_orders_after_insert on public.orders;
create trigger trg_orders_after_insert
  after insert on public.orders
  for each row
  execute function public.gc_orders_after_insert();

drop trigger if exists trg_orders_after_update on public.orders;
create trigger trg_orders_after_update
  after update on public.orders
  for each row
  when (new.status = 'livrée' and old.status is distinct from 'livrée')
  execute function public.gc_orders_after_update();
