create or replace function public.fn_calcular_punto_rocio()
returns trigger
language plpgsql
as $$
declare
  a constant numeric := 17.27;
  b constant numeric := 237.7;
  gamma numeric;
begin
  if NEW.temperatura_actual_c is not null
     and NEW.humedad_relativa_pct is not null then

    gamma :=
      (a * NEW.temperatura_actual_c) /
      (b + NEW.temperatura_actual_c)
      + ln(NEW.humedad_relativa_pct / 100.0);

    NEW.punto_de_rocio_c :=
      round((b * gamma) / (a - gamma), 2);
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_calcular_punto_rocio
on public.tomas_fenologicas;

create trigger trg_calcular_punto_rocio
before insert or update
on public.tomas_fenologicas
for each row
execute function public.fn_calcular_punto_rocio();