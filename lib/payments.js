import crypto from 'crypto';

// ── PLANES ─────────────────────────────────────────────────
export const PLANES = {
  basico: {
    id: 'basico',
    label: 'Básico',
    descripcion: 'Compite en la polla mundialista',
    precio: 30000,
    incluye_ia: false,
    distribucion: { admin: 10000, premios: 20000, ia: 0 },
    color: '#1D4ED8',
    icon: '⚽',
  },
  con_ia: {
    id: 'con_ia',
    label: 'Con IA',
    descripcion: 'Compite en la polla + contra la IA',
    precio: 50000,
    incluye_ia: true,
    distribucion: { admin: 10000, premios: 20000, ia: 20000 },
    color: '#7C3AED',
    icon: '🤖',
  },
};

// ── COMISIONES WOMPI (Colombia 2025) ───────────────────────
export const METODOS_PAGO = {
  wompi_pse: {
    id: 'wompi_pse',
    label: 'PSE',
    descripcion: 'Pago a través de tu banco online',
    icon: '🏦',
    comision_pct: 0.008,   // 0.8%
    comision_iva: 0.19,
    comision_fija: 0,
    wompi: true,
    automatico: true,
  },
  wompi_tarjeta: {
    id: 'wompi_tarjeta',
    label: 'Tarjeta crédito/débito',
    descripcion: 'Visa, Mastercard, Amex',
    icon: '💳',
    comision_pct: 0.0349,  // 3.49%
    comision_iva: 0.19,
    comision_fija: 0,
    wompi: true,
    automatico: true,
  },
  wompi_nequi: {
    id: 'wompi_nequi',
    label: 'Nequi',
    descripcion: 'Paga con tu cuenta Nequi',
    icon: '📱',
    comision_pct: 0.005,   // 0.5%
    comision_iva: 0.19,
    comision_fija: 0,
    wompi: true,
    automatico: true,
  },
  manual: {
    id: 'manual',
    label: 'Pago manual',
    descripcion: 'Consignación o transferencia a cuenta del admin',
    icon: '🏧',
    comision_pct: 0,
    comision_iva: 0,
    comision_fija: 0,
    wompi: false,
    automatico: false,
  },
};

// ── CALCULAR TOTAL CON COMISIÓN ────────────────────────────
export function calcularTotal(valorBase, metodoPagoId) {
  const metodo = METODOS_PAGO[metodoPagoId];
  if (!metodo) throw new Error('Método de pago inválido');

  const comisionBase = valorBase * metodo.comision_pct + metodo.comision_fija;
  const iva          = comisionBase * metodo.comision_iva;
  const comisionTotal = Math.ceil(comisionBase + iva);
  const total        = valorBase + comisionTotal;

  return {
    base:           valorBase,
    comision:       comisionTotal,
    comision_pct:   metodo.comision_pct,
    total,
    total_centavos: total * 100,   // Wompi trabaja en centavos
    metodo:         metodoPagoId,
  };
}

// ── WOMPI SIGNATURE ─────────────────────────────────────────
export function generarFirmaWompi(referencia, montoCentavos, moneda, secretoIntegridad) {
  const cadena = `${referencia}${montoCentavos}${moneda}${secretoIntegridad}`;
  return crypto.createHash('sha256').update(cadena).digest('hex');
}

// ── VERIFICAR WEBHOOK WOMPI ────────────────────────────────
export function verificarWebhookWompi(payload, checksumRecibido, secretoEventos) {
  const propiedades = payload?.data?.transaction;
  if (!propiedades) return false;
  const cadena = [
    propiedades.id,
    propiedades.status,
    propiedades.amount_in_cents,
    propiedades.currency,
    propiedades.payment_method_type,
    propiedades.reference,
    propiedades.created_at,
    secretoEventos,
  ].join('');
  const esperado = crypto.createHash('sha256').update(cadena).digest('hex');
  return esperado === checksumRecibido;
}

// ── FORMATO COP ────────────────────────────────────────────
export function formatCOP(valor) {
  return new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 }).format(valor);
}

// ── DISTRIBUCIÓN DEL FONDO DE PREMIOS ─────────────────────
// Nota: 60+30+10 = 100% del fondo. Los porcentajes del usuario
// suman 110%, ajustados a 60/30/10 para consistencia matemática.
export const DISTRIBUCION_PREMIOS = {
  primero:  0.60,  // 60%
  segundo:  0.30,  // 30%
  tercero:  0.10,  // 10%
};

// ── LÍMITES APUESTA IA ─────────────────────────────────────
export const IA_BET = {
  minimo:  2000,
  maximo_por_recarga: 100000,
};
