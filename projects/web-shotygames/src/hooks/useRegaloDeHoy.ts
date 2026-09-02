import { useEffect, useState } from "react";

/**
 * Cuenta regresiva del regalo del día.
 *
 * El regalo digital va incluido en "los pedidos de hoy": es una promo que se
 * renueva cada día a la medianoche, no una liquidación que se acaba. Por eso
 * la cuenta baja hasta las 00:00 y vuelve a arrancar — no es un contador falso
 * que se resetea al recargar la página.
 *
 * Ecuador es UTC-5 todo el año (no hay horario de verano), así que el corte se
 * calcula siempre contra la medianoche de Guayaquil y NO contra el reloj del
 * visitante: un cliente con el celular en otra zona horaria ve el mismo tiempo
 * restante que uno en Machala.
 */
const OFFSET_EC_MS = 5 * 60 * 60 * 1000;

/** `Date` cuyos getters UTC devuelven la hora de pared de Ecuador. */
const ahoraEC = () => new Date(Date.now() - OFFSET_EC_MS);

const msHastaMedianocheEC = () => {
  const ec = ahoraEC();
  const medianoche = Date.UTC(ec.getUTCFullYear(), ec.getUTCMonth(), ec.getUTCDate() + 1);
  return medianoche - ec.getTime();
};

const dosDigitos = (n: number) => String(n).padStart(2, "0");

export interface RegaloDeHoy {
  /** "07:12:44" — lo que falta para que se cierren los pedidos de hoy. */
  restante: string;
  /** Horas que faltan, por si querés cambiar el mensaje cuando queda poco. */
  horas: number;
  /** "martes 2 de septiembre" */
  fecha: string;
}

export function useRegaloDeHoy(): RegaloDeHoy {
  const [ms, setMs] = useState(msHastaMedianocheEC);

  useEffect(() => {
    const id = setInterval(() => setMs(msHastaMedianocheEC()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSeg = Math.max(0, Math.floor(ms / 1000));
  const horas = Math.floor(totalSeg / 3600);

  // Intl resuelve solo el nombre del día y del mes en español; le sacamos la
  // coma que mete el formato largo ("martes, 2 de septiembre").
  const fecha = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Guayaquil",
  })
    .format(new Date())
    .replace(",", "");

  return {
    restante: `${dosDigitos(horas)}:${dosDigitos(Math.floor((totalSeg % 3600) / 60))}:${dosDigitos(totalSeg % 60)}`,
    horas,
    fecha,
  };
}
