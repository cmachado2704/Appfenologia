drop trigger if exists "trg_clima_auto_calc" on "public"."tomas_fenologicas";

drop function if exists "public"."fn_clima_auto_calc"();

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


