alter table public.calibracion_frutos
  add column if not exists pais text,
  add column if not exists departamento text,
  add column if not exists provincia text,
  add column if not exists distrito text,
  add column if not exists temperatura_actual_c numeric(6,2),
  add column if not exists humedad_relativa_pct numeric(6,2),
  add column if not exists presion_atmosferica_hpa numeric(8,2),
  add column if not exists nubosidad_pct numeric(6,2),
  add column if not exists velocidad_del_viento_mps numeric(6,2),
  add column if not exists direccion_del_viento text,
  add column if not exists radiacion_solar_uv numeric(6,2),
  add column if not exists punto_de_rocio_c numeric(6,2),
  add column if not exists sensacion_termica_c numeric(6,2);

alter table public.conteo_frutos_caidos
  add column if not exists pais text,
  add column if not exists departamento text,
  add column if not exists provincia text,
  add column if not exists distrito text,
  add column if not exists temperatura_actual_c numeric(6,2),
  add column if not exists humedad_relativa_pct numeric(6,2),
  add column if not exists presion_atmosferica_hpa numeric(8,2),
  add column if not exists nubosidad_pct numeric(6,2),
  add column if not exists velocidad_del_viento_mps numeric(6,2),
  add column if not exists direccion_del_viento text,
  add column if not exists radiacion_solar_uv numeric(6,2),
  add column if not exists punto_de_rocio_c numeric(6,2),
  add column if not exists sensacion_termica_c numeric(6,2);
