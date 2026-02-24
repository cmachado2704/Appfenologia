-- =========================
-- FUNCION CALCULOS CLIMA
-- =========================
create or replace function public.fn_clima_auto_calc()
returns trigger
language plpgsql
as $$
begin

  -- Sensación térmica simple (heat index simplificado)
  if NEW.temperatura_actual_c is not null 
     and NEW.humedad_relativa_pct is not null then

    NEW.sensacion_termica_c :=
      round(
        NEW.temperatura_actual_c +
        (0.33 * NEW.humedad_relativa_pct/100 * 6.105 *
        exp(17.27*NEW.temperatura_actual_c/(237.7+NEW.temperatura_actual_c)))
        - 4,
      2);

  end if;

  return NEW;
end;
$$;


-- =========================
-- TRIGGER
-- =========================
drop trigger if exists trg_clima_auto_calc
on public.tomas_fenologicas;

create trigger trg_clima_auto_calc
before insert or update
on public.tomas_fenologicas
for each row
execute function public.fn_clima_auto_calc();