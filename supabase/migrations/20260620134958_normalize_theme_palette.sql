-- Normalize stored theme_config palettes to the consolidated design-system token
-- set (background / foreground / card / muted / border / primary / accent (+ their
-- foregrounds) / ring / destructive / success / warning).
--
-- The application (src/features/cms/config/cmsSiteConfig.zod.ts) already migrates
-- legacy palette keys on read, so this migration is a NON-DESTRUCTIVE forward
-- alignment of the persisted JSON: it derives the normalized keys from the legacy
-- ANVL-specific keys and merges them into each theme's palette. Legacy keys are
-- left in place (harmless — the schema strips unknown keys on the next save) so
-- the change is fully reversible and the live rows keep parsing throughout.
--
-- Affects cms_settings (editor source of truth) and storefront_publication
-- (anon-readable SSR mirror). Both store theme_config as a theme library
-- ({ activeThemeId, themes: [{ id, name, appearance, palette }] }).

create or replace function pg_temp.anvl_normalize_palette(p jsonb)
returns jsonb
language sql
immutable
as $$
  select p || jsonb_strip_nulls(jsonb_build_object(
    'background',        coalesce(p->>'background',        p->>'colorBg'),
    'foreground',        coalesce(p->>'foreground',        p->>'colorText'),
    'card',              coalesce(p->>'card',              p->>'colorSurface'),
    'cardForeground',    coalesce(p->>'cardForeground',    p->>'colorOnSurface', p->>'colorText'),
    'muted',             coalesce(p->>'muted',             p->>'colorSurfaceSoft'),
    'mutedForeground',   coalesce(p->>'mutedForeground',   p->>'colorTextMuted'),
    'border',            coalesce(p->>'border',            p->>'colorLine'),
    'primary',           coalesce(p->>'primary',           p->>'colorAccent'),
    'primaryForeground', coalesce(p->>'primaryForeground', p->>'colorOnAccent'),
    'accent',            coalesce(p->>'accent',            p->>'colorHighlight'),
    'accentForeground',  coalesce(p->>'accentForeground',  p->>'colorOnHighlight'),
    'ring',              coalesce(p->>'ring',              p->>'colorFocusRing', p->>'colorAccent'),
    'destructive',       coalesce(p->>'destructive',       p->>'colorDanger'),
    'success',           coalesce(p->>'success',           p->>'colorSuccess'),
    'warning',           coalesce(p->>'warning',           p->>'colorWarning')
  ));
$$;

create or replace function pg_temp.anvl_normalize_theme_config(tc jsonb)
returns jsonb
language sql
immutable
as $$
  select case
    when jsonb_typeof(tc->'themes') = 'array' then
      jsonb_set(
        tc,
        '{themes}',
        coalesce((
          select jsonb_agg(
            case
              when jsonb_typeof(t->'palette') = 'object'
                then jsonb_set(t, '{palette}', pg_temp.anvl_normalize_palette(t->'palette'))
              else t
            end
            order by ord
          )
          from jsonb_array_elements(tc->'themes') with ordinality as e(t, ord)
        ), '[]'::jsonb)
      )
    else tc
  end;
$$;

update cms_settings
set theme_config = pg_temp.anvl_normalize_theme_config(theme_config)
where jsonb_typeof(theme_config->'themes') = 'array';

update storefront_publication
set theme_config = pg_temp.anvl_normalize_theme_config(theme_config)
where jsonb_typeof(theme_config->'themes') = 'array';
