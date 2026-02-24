create or replace function public.fn_calcular_punto_rocio()
returns trigger
language plpgsql
as $function$
declare
  a constant numeric := 17.27;
  b constant numeric := 237.7;
  gamma numeric;
begin
  if new.temperatura_actual_c is not null
     and new.humedad_relativa_pct is not null
     and new.humedad_relativa_pct > 0 then
    gamma := ((a * new.temperatura_actual_c) / (b + new.temperatura_actual_c))
             + ln(new.humedad_relativa_pct / 100.0);
    new.punto_de_rocio_c := round(((b * gamma) / (a - gamma))::numeric, 2);
  else
    new.punto_de_rocio_c := null;
  end if;

  return new;
end;
$function$;

create or replace function public.fn_clima_auto_calc()
returns trigger
language plpgsql
as $function$
declare
  t numeric;
  rh numeric;
  hi_f numeric;
  hi_c numeric;
begin
  t := new.temperatura_actual_c;
  rh := new.humedad_relativa_pct;

  if t is null or rh is null then
    new.sensacion_termica_c := null;
    return new;
  end if;

  if t < 27 then
    new.sensacion_termica_c := round(t::numeric, 2);
    return new;
  end if;

  hi_f := -42.379
          + 2.04901523 * ((t * 9/5) + 32)
          + 10.14333127 * rh
          - 0.22475541 * ((t * 9/5) + 32) * rh
          - 0.00683783 * power(((t * 9/5) + 32), 2)
          - 0.05481717 * power(rh, 2)
          + 0.00122874 * power(((t * 9/5) + 32), 2) * rh
          + 0.00085282 * ((t * 9/5) + 32) * power(rh, 2)
          - 0.00000199 * power(((t * 9/5) + 32), 2) * power(rh, 2);

  hi_c := (hi_f - 32) * 5/9;
  new.sensacion_termica_c := round(hi_c::numeric, 2);
  return new;
end;
$function$;

drop trigger if exists trg_calcular_punto_rocio_tomas_fenologicas on public.tomas_fenologicas;
create trigger trg_calcular_punto_rocio_tomas_fenologicas
before insert or update on public.tomas_fenologicas
for each row
execute function public.fn_calcular_punto_rocio();

drop trigger if exists trg_clima_auto_calc_tomas_fenologicas on public.tomas_fenologicas;
create trigger trg_clima_auto_calc_tomas_fenologicas
before insert or update on public.tomas_fenologicas
for each row
execute function public.fn_clima_auto_calc();

drop trigger if exists trg_calcular_punto_rocio_calibracion_frutos on public.calibracion_frutos;
create trigger trg_calcular_punto_rocio_calibracion_frutos
before insert or update on public.calibracion_frutos
for each row
execute function public.fn_calcular_punto_rocio();

drop trigger if exists trg_clima_auto_calc_calibracion_frutos on public.calibracion_frutos;
create trigger trg_clima_auto_calc_calibracion_frutos
before insert or update on public.calibracion_frutos
for each row
execute function public.fn_clima_auto_calc();

drop trigger if exists trg_calcular_punto_rocio_conteo_frutos_caidos on public.conteo_frutos_caidos;
create trigger trg_calcular_punto_rocio_conteo_frutos_caidos
before insert or update on public.conteo_frutos_caidos
for each row
execute function public.fn_calcular_punto_rocio();

drop trigger if exists trg_clima_auto_calc_conteo_frutos_caidos on public.conteo_frutos_caidos;
create trigger trg_clima_auto_calc_conteo_frutos_caidos
before insert or update on public.conteo_frutos_caidos
for each row
execute function public.fn_clima_auto_calc();
