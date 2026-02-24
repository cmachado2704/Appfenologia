drop extension if exists "pg_net";

create extension if not exists "postgis" with schema "public";

create sequence "public"."calibracion_frutos_id_seq";

create sequence "public"."clasificacion_tamano_id_seq";

create sequence "public"."conteo_frutos_caidos_id_seq";

create sequence "public"."lado_variedad_id_seq";

create sequence "public"."orientaciones_id_orientacion_seq";

create sequence "public"."sector_id_seq";

create sequence "public"."tipos_estado_id_estado_seq";

create sequence "public"."zonas_id_zona_seq";


  create table "public"."calibracion_frutos" (
    "id" bigint not null default nextval('public.calibracion_frutos_id_seq'::regclass),
    "campaña" text,
    "num_semana" integer,
    "fecha_evaluacion" date,
    "fecha_evaluacion_anterior" date,
    "dias_evaluaciones" integer,
    "lote" text,
    "sector" text,
    "fecha_cosecha" date,
    "fila" text,
    "clasificacion" text,
    "tamaño" text,
    "calibre" numeric(5,2),
    "tc_real" numeric(5,2),
    "tc_semanal" numeric(5,2),
    "tc_proyectado" numeric(5,2),
    "calibre_final" numeric(5,2),
    "observacion" text,
    "latitud" numeric(12,8),
    "longitud" numeric(12,8),
    "inspector" text,
    "n_de_toma" text,
    "variedad" text,
    "created_at" timestamp with time zone default now(),
    "n_planta" text,
    "nombre_lote" text,
    "fotos" jsonb
      );



  create table "public"."clasificacion_tamano" (
    "codigo" text,
    "tamano" text,
    "id" integer not null default nextval('public.clasificacion_tamano_id_seq'::regclass)
      );



  create table "public"."conteo_frutos_caidos" (
    "id" bigint not null default nextval('public.conteo_frutos_caidos_id_seq'::regclass),
    "cosecha" text,
    "num_semana" integer,
    "fecha_evaluacion" date,
    "fecha_evaluacion_anterior" date,
    "dias_evaluaciones" integer,
    "sector" text,
    "lote" text,
    "variedad" text,
    "n_de_toma" text,
    "lado" text,
    "fila" text,
    "n_frutos_caidos" integer,
    "n_frutos_caidos_dia" numeric(5,2),
    "n_frutos_caidos_semana" numeric(5,2),
    "diferencia_frutos_caidos_dia" numeric(5,2),
    "calibre_minimo" numeric(5,2),
    "calibre_maximo" numeric(5,2),
    "comparativa_otras_plantas" text,
    "inspector" text,
    "latitud" numeric(12,8),
    "longitud" numeric(12,8),
    "created_at" timestamp with time zone default now(),
    "n_planta" numeric,
    "fotos" jsonb,
    "nombre_lote" text
      );



  create table "public"."cultivos" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" text not null
      );



  create table "public"."inspectores" (
    "id_inspector" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "nombre" text not null,
    "apellido_paterno" text not null,
    "apellido_materno" text not null,
    "dni" text not null,
    "tipo_de_usuario" text,
    "clave" text,
    "activo" boolean default true,
    "fecha_creacion" timestamp without time zone default now(),
    "usuario" text
      );



  create table "public"."lado_variedad" (
    "id" integer not null default nextval('public.lado_variedad_id_seq'::regclass),
    "nombre" text not null
      );



  create table "public"."lotes" (
    "id_lote" uuid not null default gen_random_uuid(),
    "nombre_lote" text not null,
    "variedad" text,
    "latitud" double precision,
    "longitud" double precision,
    "plantas_calculadas" integer,
    "codigo_lote" character varying(7),
    "area_neta_estimada_ha" numeric
      );



  create table "public"."orientaciones" (
    "nombre_orientacion" text,
    "id_orientacion" integer not null default nextval('public.orientaciones_id_orientacion_seq'::regclass)
      );



  create table "public"."sector" (
    "id" integer not null default nextval('public.sector_id_seq'::regclass),
    "nombre" text not null
      );



  create table "public"."tipos_estado" (
    "tipo_estado" text,
    "es_estado" text,
    "id_estado" integer not null default nextval('public.tipos_estado_id_estado_seq'::regclass),
    "cultivo" text
      );



  create table "public"."tomas" (
    "id_toma" uuid not null default gen_random_uuid(),
    "n_de_toma" text,
    "codigo_lote" text,
    "nombre_lote" text,
    "muestra_sugerida" numeric(8,2),
    "fundo" text,
    "estado" text,
    "fecha_aprobacion" timestamp with time zone,
    "usuario_aprobador" text,
    "fecha_creacion" timestamp with time zone,
    "fecha_fin" timestamp with time zone,
    "variedad" text,
    "tipo_toma" text
      );



  create table "public"."tomas_fenologicas" (
    "id_toma_fenologica" uuid not null default gen_random_uuid(),
    "id_toma" uuid,
    "codigo_lote" character varying(7),
    "nombre_lote" text,
    "variedad" text,
    "muestra_sugerida" numeric(8,2),
    "planta" integer,
    "fila" integer,
    "n_rama" integer,
    "tipo_estado" text,
    "es_estado" text,
    "cantidad" numeric(8,2),
    "total" numeric(8,2),
    "porcentaje" numeric(6,2),
    "pais" text,
    "departamento" text,
    "provincia" text,
    "distrito" text,
    "latitud" double precision,
    "longitud" double precision,
    "fuente_de_datos" text,
    "fecha_y_hora" timestamp with time zone,
    "temperatura_actual_c" numeric(6,2),
    "humedad_relativa_pct" numeric(6,2),
    "presion_atmosferica_hpa" numeric(8,2),
    "sensacion_termica_c" numeric(6,2),
    "nubosidad_pct" numeric(6,2),
    "punto_de_rocio_c" numeric(6,2),
    "velocidad_del_viento_mps" numeric(6,2),
    "direccion_del_viento" text,
    "radiacion_solar_uv" numeric(6,2),
    "n_de_toma" text,
    "bloqueado" boolean default false,
    "confirmado" boolean default false,
    "fotos" jsonb,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "inspector" text,
    "zona" text,
    "orientacion" text
      );



  create table "public"."zonas" (
    "nombre_zona" text,
    "id_zona" integer not null default nextval('public.zonas_id_zona_seq'::regclass)
      );


alter sequence "public"."calibracion_frutos_id_seq" owned by "public"."calibracion_frutos"."id";

alter sequence "public"."clasificacion_tamano_id_seq" owned by "public"."clasificacion_tamano"."id";

alter sequence "public"."conteo_frutos_caidos_id_seq" owned by "public"."conteo_frutos_caidos"."id";

alter sequence "public"."lado_variedad_id_seq" owned by "public"."lado_variedad"."id";

alter sequence "public"."orientaciones_id_orientacion_seq" owned by "public"."orientaciones"."id_orientacion";

alter sequence "public"."sector_id_seq" owned by "public"."sector"."id";

alter sequence "public"."tipos_estado_id_estado_seq" owned by "public"."tipos_estado"."id_estado";

alter sequence "public"."zonas_id_zona_seq" owned by "public"."zonas"."id_zona";

CREATE UNIQUE INDEX calibracion_frutos_pkey ON public.calibracion_frutos USING btree (id);

CREATE UNIQUE INDEX clasificacion_tamano_pkey ON public.clasificacion_tamano USING btree (id);

CREATE UNIQUE INDEX conteo_frutos_caidos_pkey ON public.conteo_frutos_caidos USING btree (id);

CREATE UNIQUE INDEX cultivos_nombre_key ON public.cultivos USING btree (nombre);

CREATE UNIQUE INDEX cultivos_pkey ON public.cultivos USING btree (id);

CREATE UNIQUE INDEX inspectores_dni_key ON public.inspectores USING btree (dni);

CREATE UNIQUE INDEX inspectores_pkey ON public.inspectores USING btree (id_inspector);

CREATE UNIQUE INDEX lado_variedad_nombre_key ON public.lado_variedad USING btree (nombre);

CREATE UNIQUE INDEX lado_variedad_pkey ON public.lado_variedad USING btree (id);

CREATE UNIQUE INDEX lotes_pkey ON public.lotes USING btree (id_lote);

CREATE UNIQUE INDEX orientaciones_nombre_orientacion_key ON public.orientaciones USING btree (nombre_orientacion);

CREATE UNIQUE INDEX orientaciones_pkey ON public.orientaciones USING btree (id_orientacion);

CREATE UNIQUE INDEX sector_nombre_key ON public.sector USING btree (nombre);

CREATE UNIQUE INDEX sector_pkey ON public.sector USING btree (id);

CREATE UNIQUE INDEX tipos_estado_codigo_estado_key ON public.tipos_estado USING btree (tipo_estado);

CREATE UNIQUE INDEX tipos_estado_pkey ON public.tipos_estado USING btree (id_estado);

CREATE UNIQUE INDEX tomas_fenologicas_pkey ON public.tomas_fenologicas USING btree (id_toma_fenologica);

CREATE UNIQUE INDEX tomas_n_de_toma_key ON public.tomas USING btree (n_de_toma);

CREATE UNIQUE INDEX tomas_pkey ON public.tomas USING btree (id_toma);

CREATE UNIQUE INDEX uq_codigo_lote ON public.lotes USING btree (codigo_lote);

CREATE UNIQUE INDEX zonas_nombre_zona_key ON public.zonas USING btree (nombre_zona);

CREATE UNIQUE INDEX zonas_pkey ON public.zonas USING btree (id_zona);

alter table "public"."calibracion_frutos" add constraint "calibracion_frutos_pkey" PRIMARY KEY using index "calibracion_frutos_pkey";

alter table "public"."clasificacion_tamano" add constraint "clasificacion_tamano_pkey" PRIMARY KEY using index "clasificacion_tamano_pkey";

alter table "public"."conteo_frutos_caidos" add constraint "conteo_frutos_caidos_pkey" PRIMARY KEY using index "conteo_frutos_caidos_pkey";

alter table "public"."cultivos" add constraint "cultivos_pkey" PRIMARY KEY using index "cultivos_pkey";

alter table "public"."inspectores" add constraint "inspectores_pkey" PRIMARY KEY using index "inspectores_pkey";

alter table "public"."lado_variedad" add constraint "lado_variedad_pkey" PRIMARY KEY using index "lado_variedad_pkey";

alter table "public"."lotes" add constraint "lotes_pkey" PRIMARY KEY using index "lotes_pkey";

alter table "public"."orientaciones" add constraint "orientaciones_pkey" PRIMARY KEY using index "orientaciones_pkey";

alter table "public"."sector" add constraint "sector_pkey" PRIMARY KEY using index "sector_pkey";

alter table "public"."tipos_estado" add constraint "tipos_estado_pkey" PRIMARY KEY using index "tipos_estado_pkey";

alter table "public"."tomas" add constraint "tomas_pkey" PRIMARY KEY using index "tomas_pkey";

alter table "public"."tomas_fenologicas" add constraint "tomas_fenologicas_pkey" PRIMARY KEY using index "tomas_fenologicas_pkey";

alter table "public"."zonas" add constraint "zonas_pkey" PRIMARY KEY using index "zonas_pkey";

alter table "public"."cultivos" add constraint "cultivos_nombre_key" UNIQUE using index "cultivos_nombre_key";

alter table "public"."inspectores" add constraint "inspectores_dni_key" UNIQUE using index "inspectores_dni_key";

alter table "public"."inspectores" add constraint "inspectores_tipo_de_usuario_check" CHECK ((tipo_de_usuario = ANY (ARRAY['INSPECTOR'::text, 'SUPERVISOR'::text]))) not valid;

alter table "public"."inspectores" validate constraint "inspectores_tipo_de_usuario_check";

alter table "public"."inspectores" add constraint "inspectores_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."inspectores" validate constraint "inspectores_user_id_fkey";

alter table "public"."lado_variedad" add constraint "lado_variedad_nombre_key" UNIQUE using index "lado_variedad_nombre_key";

alter table "public"."lotes" add constraint "uq_codigo_lote" UNIQUE using index "uq_codigo_lote";

alter table "public"."orientaciones" add constraint "orientaciones_nombre_orientacion_key" UNIQUE using index "orientaciones_nombre_orientacion_key";

alter table "public"."sector" add constraint "sector_nombre_key" UNIQUE using index "sector_nombre_key";

alter table "public"."tipos_estado" add constraint "tipos_estado_codigo_estado_key" UNIQUE using index "tipos_estado_codigo_estado_key";

alter table "public"."tomas" add constraint "tipo_toma_valid" CHECK (((tipo_toma IS NULL) OR (tipo_toma = ANY (ARRAY['fenologica'::text, 'conteo'::text, 'calibracion'::text, 'generica'::text])))) not valid;

alter table "public"."tomas" validate constraint "tipo_toma_valid";

alter table "public"."tomas" add constraint "tomas_n_de_toma_key" UNIQUE using index "tomas_n_de_toma_key";

alter table "public"."tomas_fenologicas" add constraint "fk_codigo_lote" FOREIGN KEY (codigo_lote) REFERENCES public.lotes(codigo_lote) not valid;

alter table "public"."tomas_fenologicas" validate constraint "fk_codigo_lote";

alter table "public"."tomas_fenologicas" add constraint "tomas_fenologicas_id_toma_fkey" FOREIGN KEY (id_toma) REFERENCES public.tomas(id_toma) ON DELETE CASCADE not valid;

alter table "public"."tomas_fenologicas" validate constraint "tomas_fenologicas_id_toma_fkey";

alter table "public"."zonas" add constraint "zonas_nombre_zona_key" UNIQUE using index "zonas_nombre_zona_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fn_calcular_conteo_frutos_caidos()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_fecha_anterior DATE;
    v_dias INTEGER;
    v_frutos_dia_anterior NUMERIC;
BEGIN
    /* -------------------------------------------------
       1. Buscar fecha de evaluación anterior
       (mismo sector + lote + lado)
    ------------------------------------------------- */
    SELECT fecha_evaluacion
    INTO v_fecha_anterior
    FROM conteo_frutos_caidos
    WHERE sector = NEW.sector
      AND lote   = NEW.lote
      AND lado   = NEW.lado
      AND fecha_evaluacion < NEW.fecha_evaluacion
    ORDER BY fecha_evaluacion DESC
    LIMIT 1;

    NEW.fecha_evaluacion_anterior := v_fecha_anterior;

    /* -------------------------------------------------
       2. Calcular días entre evaluaciones
    ------------------------------------------------- */
    IF v_fecha_anterior IS NOT NULL THEN
        v_dias := (NEW.fecha_evaluacion - v_fecha_anterior);
        IF v_dias < 1 THEN
            v_dias := 1;
        END IF;
    ELSE
        v_dias := NULL;
    END IF;

    NEW.dias_evaluaciones := v_dias;

    /* -------------------------------------------------
       3. Frutos caídos por día
    ------------------------------------------------- */
    IF v_dias IS NOT NULL THEN
        NEW.n_frutos_caidos_dia :=
            ROUND(NEW.n_frutos_caidos::NUMERIC / v_dias, 2);
    ELSE
        NEW.n_frutos_caidos_dia := NULL;
    END IF;

    /* -------------------------------------------------
       4. Frutos caídos por semana
    ------------------------------------------------- */
    IF NEW.n_frutos_caidos_dia IS NOT NULL THEN
        NEW.n_frutos_caidos_semana :=
            ROUND(NEW.n_frutos_caidos_dia * 7, 1);
    ELSE
        NEW.n_frutos_caidos_semana := NULL;
    END IF;

    /* -------------------------------------------------
       5. Diferencia vs evaluación anterior (por día)
    ------------------------------------------------- */
    IF v_fecha_anterior IS NOT NULL THEN
        SELECT n_frutos_caidos_dia
        INTO v_frutos_dia_anterior
        FROM conteo_frutos_caidos
        WHERE sector = NEW.sector
          AND lote   = NEW.lote
          AND lado   = NEW.lado
          AND fecha_evaluacion = v_fecha_anterior
        LIMIT 1;

        IF v_frutos_dia_anterior IS NOT NULL
           AND NEW.n_frutos_caidos_dia IS NOT NULL THEN
            NEW.diferencia_frutos_caidos_dia :=
                ROUND(
                  NEW.n_frutos_caidos_dia - v_frutos_dia_anterior,
                  2
                );
        ELSE
            NEW.diferencia_frutos_caidos_dia := NULL;
        END IF;
    ELSE
        NEW.diferencia_frutos_caidos_dia := NULL;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_calcular_dias_evaluaciones()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_fecha_anterior date;
BEGIN
  -- Buscar la fecha_evaluacion anterior
  SELECT MAX(fecha_evaluacion)
  INTO v_fecha_anterior
  FROM calibracion_frutos
  WHERE lote = NEW.lote
    AND sector = NEW.sector
    AND fecha_evaluacion < NEW.fecha_evaluacion;

  -- Asignar fecha anterior
  NEW.fecha_evaluacion_anterior := v_fecha_anterior;

  -- Calcular días (si existe fecha anterior)
  IF v_fecha_anterior IS NOT NULL THEN
    NEW.dias_evaluaciones := NEW.fecha_evaluacion - v_fecha_anterior;
  ELSE
    NEW.dias_evaluaciones := NULL;
  END IF;

  RETURN NEW;
END;
$function$
;

create type "public"."geometry_dump" as ("path" integer[], "geom" public.geometry);

create type "public"."valid_detail" as ("valid" boolean, "reason" character varying, "location" public.geometry);

grant delete on table "public"."calibracion_frutos" to "anon";

grant insert on table "public"."calibracion_frutos" to "anon";

grant references on table "public"."calibracion_frutos" to "anon";

grant select on table "public"."calibracion_frutos" to "anon";

grant trigger on table "public"."calibracion_frutos" to "anon";

grant truncate on table "public"."calibracion_frutos" to "anon";

grant update on table "public"."calibracion_frutos" to "anon";

grant delete on table "public"."calibracion_frutos" to "authenticated";

grant insert on table "public"."calibracion_frutos" to "authenticated";

grant references on table "public"."calibracion_frutos" to "authenticated";

grant select on table "public"."calibracion_frutos" to "authenticated";

grant trigger on table "public"."calibracion_frutos" to "authenticated";

grant truncate on table "public"."calibracion_frutos" to "authenticated";

grant update on table "public"."calibracion_frutos" to "authenticated";

grant delete on table "public"."calibracion_frutos" to "service_role";

grant insert on table "public"."calibracion_frutos" to "service_role";

grant references on table "public"."calibracion_frutos" to "service_role";

grant select on table "public"."calibracion_frutos" to "service_role";

grant trigger on table "public"."calibracion_frutos" to "service_role";

grant truncate on table "public"."calibracion_frutos" to "service_role";

grant update on table "public"."calibracion_frutos" to "service_role";

grant delete on table "public"."clasificacion_tamano" to "anon";

grant insert on table "public"."clasificacion_tamano" to "anon";

grant references on table "public"."clasificacion_tamano" to "anon";

grant select on table "public"."clasificacion_tamano" to "anon";

grant trigger on table "public"."clasificacion_tamano" to "anon";

grant truncate on table "public"."clasificacion_tamano" to "anon";

grant update on table "public"."clasificacion_tamano" to "anon";

grant delete on table "public"."clasificacion_tamano" to "authenticated";

grant insert on table "public"."clasificacion_tamano" to "authenticated";

grant references on table "public"."clasificacion_tamano" to "authenticated";

grant select on table "public"."clasificacion_tamano" to "authenticated";

grant trigger on table "public"."clasificacion_tamano" to "authenticated";

grant truncate on table "public"."clasificacion_tamano" to "authenticated";

grant update on table "public"."clasificacion_tamano" to "authenticated";

grant delete on table "public"."clasificacion_tamano" to "service_role";

grant insert on table "public"."clasificacion_tamano" to "service_role";

grant references on table "public"."clasificacion_tamano" to "service_role";

grant select on table "public"."clasificacion_tamano" to "service_role";

grant trigger on table "public"."clasificacion_tamano" to "service_role";

grant truncate on table "public"."clasificacion_tamano" to "service_role";

grant update on table "public"."clasificacion_tamano" to "service_role";

grant delete on table "public"."conteo_frutos_caidos" to "anon";

grant insert on table "public"."conteo_frutos_caidos" to "anon";

grant references on table "public"."conteo_frutos_caidos" to "anon";

grant select on table "public"."conteo_frutos_caidos" to "anon";

grant trigger on table "public"."conteo_frutos_caidos" to "anon";

grant truncate on table "public"."conteo_frutos_caidos" to "anon";

grant update on table "public"."conteo_frutos_caidos" to "anon";

grant delete on table "public"."conteo_frutos_caidos" to "authenticated";

grant insert on table "public"."conteo_frutos_caidos" to "authenticated";

grant references on table "public"."conteo_frutos_caidos" to "authenticated";

grant select on table "public"."conteo_frutos_caidos" to "authenticated";

grant trigger on table "public"."conteo_frutos_caidos" to "authenticated";

grant truncate on table "public"."conteo_frutos_caidos" to "authenticated";

grant update on table "public"."conteo_frutos_caidos" to "authenticated";

grant delete on table "public"."conteo_frutos_caidos" to "service_role";

grant insert on table "public"."conteo_frutos_caidos" to "service_role";

grant references on table "public"."conteo_frutos_caidos" to "service_role";

grant select on table "public"."conteo_frutos_caidos" to "service_role";

grant trigger on table "public"."conteo_frutos_caidos" to "service_role";

grant truncate on table "public"."conteo_frutos_caidos" to "service_role";

grant update on table "public"."conteo_frutos_caidos" to "service_role";

grant delete on table "public"."cultivos" to "anon";

grant insert on table "public"."cultivos" to "anon";

grant references on table "public"."cultivos" to "anon";

grant select on table "public"."cultivos" to "anon";

grant trigger on table "public"."cultivos" to "anon";

grant truncate on table "public"."cultivos" to "anon";

grant update on table "public"."cultivos" to "anon";

grant delete on table "public"."cultivos" to "authenticated";

grant insert on table "public"."cultivos" to "authenticated";

grant references on table "public"."cultivos" to "authenticated";

grant select on table "public"."cultivos" to "authenticated";

grant trigger on table "public"."cultivos" to "authenticated";

grant truncate on table "public"."cultivos" to "authenticated";

grant update on table "public"."cultivos" to "authenticated";

grant delete on table "public"."cultivos" to "service_role";

grant insert on table "public"."cultivos" to "service_role";

grant references on table "public"."cultivos" to "service_role";

grant select on table "public"."cultivos" to "service_role";

grant trigger on table "public"."cultivos" to "service_role";

grant truncate on table "public"."cultivos" to "service_role";

grant update on table "public"."cultivos" to "service_role";

grant delete on table "public"."inspectores" to "anon";

grant insert on table "public"."inspectores" to "anon";

grant references on table "public"."inspectores" to "anon";

grant select on table "public"."inspectores" to "anon";

grant trigger on table "public"."inspectores" to "anon";

grant truncate on table "public"."inspectores" to "anon";

grant update on table "public"."inspectores" to "anon";

grant delete on table "public"."inspectores" to "authenticated";

grant insert on table "public"."inspectores" to "authenticated";

grant references on table "public"."inspectores" to "authenticated";

grant select on table "public"."inspectores" to "authenticated";

grant trigger on table "public"."inspectores" to "authenticated";

grant truncate on table "public"."inspectores" to "authenticated";

grant update on table "public"."inspectores" to "authenticated";

grant delete on table "public"."inspectores" to "service_role";

grant insert on table "public"."inspectores" to "service_role";

grant references on table "public"."inspectores" to "service_role";

grant select on table "public"."inspectores" to "service_role";

grant trigger on table "public"."inspectores" to "service_role";

grant truncate on table "public"."inspectores" to "service_role";

grant update on table "public"."inspectores" to "service_role";

grant delete on table "public"."lado_variedad" to "anon";

grant insert on table "public"."lado_variedad" to "anon";

grant references on table "public"."lado_variedad" to "anon";

grant select on table "public"."lado_variedad" to "anon";

grant trigger on table "public"."lado_variedad" to "anon";

grant truncate on table "public"."lado_variedad" to "anon";

grant update on table "public"."lado_variedad" to "anon";

grant delete on table "public"."lado_variedad" to "authenticated";

grant insert on table "public"."lado_variedad" to "authenticated";

grant references on table "public"."lado_variedad" to "authenticated";

grant select on table "public"."lado_variedad" to "authenticated";

grant trigger on table "public"."lado_variedad" to "authenticated";

grant truncate on table "public"."lado_variedad" to "authenticated";

grant update on table "public"."lado_variedad" to "authenticated";

grant delete on table "public"."lado_variedad" to "service_role";

grant insert on table "public"."lado_variedad" to "service_role";

grant references on table "public"."lado_variedad" to "service_role";

grant select on table "public"."lado_variedad" to "service_role";

grant trigger on table "public"."lado_variedad" to "service_role";

grant truncate on table "public"."lado_variedad" to "service_role";

grant update on table "public"."lado_variedad" to "service_role";

grant delete on table "public"."lotes" to "anon";

grant insert on table "public"."lotes" to "anon";

grant references on table "public"."lotes" to "anon";

grant select on table "public"."lotes" to "anon";

grant trigger on table "public"."lotes" to "anon";

grant truncate on table "public"."lotes" to "anon";

grant update on table "public"."lotes" to "anon";

grant delete on table "public"."lotes" to "authenticated";

grant insert on table "public"."lotes" to "authenticated";

grant references on table "public"."lotes" to "authenticated";

grant select on table "public"."lotes" to "authenticated";

grant trigger on table "public"."lotes" to "authenticated";

grant truncate on table "public"."lotes" to "authenticated";

grant update on table "public"."lotes" to "authenticated";

grant delete on table "public"."lotes" to "service_role";

grant insert on table "public"."lotes" to "service_role";

grant references on table "public"."lotes" to "service_role";

grant select on table "public"."lotes" to "service_role";

grant trigger on table "public"."lotes" to "service_role";

grant truncate on table "public"."lotes" to "service_role";

grant update on table "public"."lotes" to "service_role";

grant delete on table "public"."orientaciones" to "anon";

grant insert on table "public"."orientaciones" to "anon";

grant references on table "public"."orientaciones" to "anon";

grant select on table "public"."orientaciones" to "anon";

grant trigger on table "public"."orientaciones" to "anon";

grant truncate on table "public"."orientaciones" to "anon";

grant update on table "public"."orientaciones" to "anon";

grant delete on table "public"."orientaciones" to "authenticated";

grant insert on table "public"."orientaciones" to "authenticated";

grant references on table "public"."orientaciones" to "authenticated";

grant select on table "public"."orientaciones" to "authenticated";

grant trigger on table "public"."orientaciones" to "authenticated";

grant truncate on table "public"."orientaciones" to "authenticated";

grant update on table "public"."orientaciones" to "authenticated";

grant delete on table "public"."orientaciones" to "service_role";

grant insert on table "public"."orientaciones" to "service_role";

grant references on table "public"."orientaciones" to "service_role";

grant select on table "public"."orientaciones" to "service_role";

grant trigger on table "public"."orientaciones" to "service_role";

grant truncate on table "public"."orientaciones" to "service_role";

grant update on table "public"."orientaciones" to "service_role";

grant delete on table "public"."sector" to "anon";

grant insert on table "public"."sector" to "anon";

grant references on table "public"."sector" to "anon";

grant select on table "public"."sector" to "anon";

grant trigger on table "public"."sector" to "anon";

grant truncate on table "public"."sector" to "anon";

grant update on table "public"."sector" to "anon";

grant delete on table "public"."sector" to "authenticated";

grant insert on table "public"."sector" to "authenticated";

grant references on table "public"."sector" to "authenticated";

grant select on table "public"."sector" to "authenticated";

grant trigger on table "public"."sector" to "authenticated";

grant truncate on table "public"."sector" to "authenticated";

grant update on table "public"."sector" to "authenticated";

grant delete on table "public"."sector" to "service_role";

grant insert on table "public"."sector" to "service_role";

grant references on table "public"."sector" to "service_role";

grant select on table "public"."sector" to "service_role";

grant trigger on table "public"."sector" to "service_role";

grant truncate on table "public"."sector" to "service_role";

grant update on table "public"."sector" to "service_role";

grant delete on table "public"."spatial_ref_sys" to "anon";

grant insert on table "public"."spatial_ref_sys" to "anon";

grant references on table "public"."spatial_ref_sys" to "anon";

grant select on table "public"."spatial_ref_sys" to "anon";

grant trigger on table "public"."spatial_ref_sys" to "anon";

grant truncate on table "public"."spatial_ref_sys" to "anon";

grant update on table "public"."spatial_ref_sys" to "anon";

grant delete on table "public"."spatial_ref_sys" to "authenticated";

grant insert on table "public"."spatial_ref_sys" to "authenticated";

grant references on table "public"."spatial_ref_sys" to "authenticated";

grant select on table "public"."spatial_ref_sys" to "authenticated";

grant trigger on table "public"."spatial_ref_sys" to "authenticated";

grant truncate on table "public"."spatial_ref_sys" to "authenticated";

grant update on table "public"."spatial_ref_sys" to "authenticated";

grant delete on table "public"."spatial_ref_sys" to "postgres";

grant insert on table "public"."spatial_ref_sys" to "postgres";

grant references on table "public"."spatial_ref_sys" to "postgres";

grant select on table "public"."spatial_ref_sys" to "postgres";

grant trigger on table "public"."spatial_ref_sys" to "postgres";

grant truncate on table "public"."spatial_ref_sys" to "postgres";

grant update on table "public"."spatial_ref_sys" to "postgres";

grant delete on table "public"."spatial_ref_sys" to "service_role";

grant insert on table "public"."spatial_ref_sys" to "service_role";

grant references on table "public"."spatial_ref_sys" to "service_role";

grant select on table "public"."spatial_ref_sys" to "service_role";

grant trigger on table "public"."spatial_ref_sys" to "service_role";

grant truncate on table "public"."spatial_ref_sys" to "service_role";

grant update on table "public"."spatial_ref_sys" to "service_role";

grant delete on table "public"."tipos_estado" to "anon";

grant insert on table "public"."tipos_estado" to "anon";

grant references on table "public"."tipos_estado" to "anon";

grant select on table "public"."tipos_estado" to "anon";

grant trigger on table "public"."tipos_estado" to "anon";

grant truncate on table "public"."tipos_estado" to "anon";

grant update on table "public"."tipos_estado" to "anon";

grant delete on table "public"."tipos_estado" to "authenticated";

grant insert on table "public"."tipos_estado" to "authenticated";

grant references on table "public"."tipos_estado" to "authenticated";

grant select on table "public"."tipos_estado" to "authenticated";

grant trigger on table "public"."tipos_estado" to "authenticated";

grant truncate on table "public"."tipos_estado" to "authenticated";

grant update on table "public"."tipos_estado" to "authenticated";

grant delete on table "public"."tipos_estado" to "service_role";

grant insert on table "public"."tipos_estado" to "service_role";

grant references on table "public"."tipos_estado" to "service_role";

grant select on table "public"."tipos_estado" to "service_role";

grant trigger on table "public"."tipos_estado" to "service_role";

grant truncate on table "public"."tipos_estado" to "service_role";

grant update on table "public"."tipos_estado" to "service_role";

grant delete on table "public"."tomas" to "anon";

grant insert on table "public"."tomas" to "anon";

grant references on table "public"."tomas" to "anon";

grant select on table "public"."tomas" to "anon";

grant trigger on table "public"."tomas" to "anon";

grant truncate on table "public"."tomas" to "anon";

grant update on table "public"."tomas" to "anon";

grant delete on table "public"."tomas" to "authenticated";

grant insert on table "public"."tomas" to "authenticated";

grant references on table "public"."tomas" to "authenticated";

grant select on table "public"."tomas" to "authenticated";

grant trigger on table "public"."tomas" to "authenticated";

grant truncate on table "public"."tomas" to "authenticated";

grant update on table "public"."tomas" to "authenticated";

grant delete on table "public"."tomas" to "service_role";

grant insert on table "public"."tomas" to "service_role";

grant references on table "public"."tomas" to "service_role";

grant select on table "public"."tomas" to "service_role";

grant trigger on table "public"."tomas" to "service_role";

grant truncate on table "public"."tomas" to "service_role";

grant update on table "public"."tomas" to "service_role";

grant delete on table "public"."tomas_fenologicas" to "anon";

grant insert on table "public"."tomas_fenologicas" to "anon";

grant references on table "public"."tomas_fenologicas" to "anon";

grant select on table "public"."tomas_fenologicas" to "anon";

grant trigger on table "public"."tomas_fenologicas" to "anon";

grant truncate on table "public"."tomas_fenologicas" to "anon";

grant update on table "public"."tomas_fenologicas" to "anon";

grant delete on table "public"."tomas_fenologicas" to "authenticated";

grant insert on table "public"."tomas_fenologicas" to "authenticated";

grant references on table "public"."tomas_fenologicas" to "authenticated";

grant select on table "public"."tomas_fenologicas" to "authenticated";

grant trigger on table "public"."tomas_fenologicas" to "authenticated";

grant truncate on table "public"."tomas_fenologicas" to "authenticated";

grant update on table "public"."tomas_fenologicas" to "authenticated";

grant delete on table "public"."tomas_fenologicas" to "service_role";

grant insert on table "public"."tomas_fenologicas" to "service_role";

grant references on table "public"."tomas_fenologicas" to "service_role";

grant select on table "public"."tomas_fenologicas" to "service_role";

grant trigger on table "public"."tomas_fenologicas" to "service_role";

grant truncate on table "public"."tomas_fenologicas" to "service_role";

grant update on table "public"."tomas_fenologicas" to "service_role";

grant delete on table "public"."zonas" to "anon";

grant insert on table "public"."zonas" to "anon";

grant references on table "public"."zonas" to "anon";

grant select on table "public"."zonas" to "anon";

grant trigger on table "public"."zonas" to "anon";

grant truncate on table "public"."zonas" to "anon";

grant update on table "public"."zonas" to "anon";

grant delete on table "public"."zonas" to "authenticated";

grant insert on table "public"."zonas" to "authenticated";

grant references on table "public"."zonas" to "authenticated";

grant select on table "public"."zonas" to "authenticated";

grant trigger on table "public"."zonas" to "authenticated";

grant truncate on table "public"."zonas" to "authenticated";

grant update on table "public"."zonas" to "authenticated";

grant delete on table "public"."zonas" to "service_role";

grant insert on table "public"."zonas" to "service_role";

grant references on table "public"."zonas" to "service_role";

grant select on table "public"."zonas" to "service_role";

grant trigger on table "public"."zonas" to "service_role";

grant truncate on table "public"."zonas" to "service_role";

grant update on table "public"."zonas" to "service_role";


  create policy "allow inserts from app"
  on "public"."calibracion_frutos"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow read access"
  on "public"."clasificacion_tamano"
  as permissive
  for select
  to anon
using (true);



  create policy "allow inserts from app"
  on "public"."conteo_frutos_caidos"
  as permissive
  for insert
  to public
with check (true);



  create policy "lado_variedad_insert"
  on "public"."lado_variedad"
  as permissive
  for insert
  to public
with check (true);



  create policy "lado_variedad_select"
  on "public"."lado_variedad"
  as permissive
  for select
  to public
using (true);



  create policy "lado_variedad_update"
  on "public"."lado_variedad"
  as permissive
  for update
  to public
using (true);



  create policy "sector_insert"
  on "public"."sector"
  as permissive
  for insert
  to public
with check (true);



  create policy "sector_select"
  on "public"."sector"
  as permissive
  for select
  to public
using (true);



  create policy "sector_update"
  on "public"."sector"
  as permissive
  for update
  to public
using (true);



  create policy "Read all estados"
  on "public"."tipos_estado"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER trg_calcular_dias_evaluaciones BEFORE INSERT OR UPDATE ON public.calibracion_frutos FOR EACH ROW EXECUTE FUNCTION public.fn_calcular_dias_evaluaciones();

CREATE TRIGGER trg_conteo_frutos_caidos_calculos BEFORE INSERT ON public.conteo_frutos_caidos FOR EACH ROW EXECUTE FUNCTION public.fn_calcular_conteo_frutos_caidos();


  create policy "Lectura pública de fotos"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'fotos_registros'::text));



  create policy "Usuarios autenticados pueden subir fotos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'fotos_registros'::text));



  create policy "allow_insert_photos"
  on "storage"."objects"
  as permissive
  for insert
  to anon
with check ((bucket_id = 'fotos_registros'::text));



