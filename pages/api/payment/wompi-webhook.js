import { db } from '../../../lib/db';
import { verificarWebhookWompi, PLANES } from '../../../lib/payments';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const checksum = req.headers['x-event-checksum'] || '';
  const payload  = req.body;

  // Verificar firma del webhook
  const secreto = process.env.WOMPI_EVENTS_SECRET || '';
  if (secreto && !verificarWebhookWompi(payload, checksum, secreto)) {
    console.error('[Wompi webhook] Firma inválida');
    return res.status(401).json({ error: 'Firma inválida' });
  }

  const evento = payload?.event;
  const txn    = payload?.data?.transaction;

  if (!txn) return res.status(200).json({ ok: true }); // ignorar eventos sin transacción

  const { reference, status, amount_in_cents } = txn;

  // Solo procesar transacciones aprobadas
  if (status !== 'APPROVED') {
    console.log(`[Wompi] Transacción ${reference} con estado ${status} — ignorada`);
    return res.status(200).json({ ok: true });
  }

  const payment = db.payments.findByRef(reference);
  if (!payment) {
    console.error(`[Wompi] Pago no encontrado para referencia: ${reference}`);
    return res.status(200).json({ ok: true });
  }

  if (payment.estado === 'aprobado') {
    return res.status(200).json({ ok: true, mensaje: 'Ya aprobado' });
  }

  // Verificar que el monto coincida (tolerancia de 1 peso)
  const montoEsperado = payment.valorTotal * 100;
  if (Math.abs(amount_in_cents - montoEsperado) > 100) {
    console.error(`[Wompi] Monto incorrecto: recibido ${amount_in_cents}, esperado ${montoEsperado}`);
    db.payments.update(payment.id, { estado:'monto_incorrecto', wompiData: txn });
    return res.status(200).json({ ok: true });
  }

  // Aprobar el pago y activar el usuario
  aprobarPago(payment, txn, 'wompi_automatico');

  return res.status(200).json({ ok: true });
}

export function aprobarPago(payment, extraData = {}, metodoAprobacion = 'manual') {
  const plan = PLANES[payment.planId];

  db.payments.update(payment.id, {
    estado:             'aprobado',
    metodoAprobacion,
    aprobadoEn:         new Date().toISOString(),
    wompiData:          extraData,
  });

  const userUpdates = {
    estado:      'activo',
    planId:      payment.planId,
    incluye_ia:  plan?.incluye_ia || false,
    saldoIA:     plan?.incluye_ia ? (plan.distribucion.ia || 0) : 0,
    activadoEn:  new Date().toISOString(),
    tipoParticipacion: payment.tipoParticipacion || 'individual',
  };

  db.users.update(payment.userId, userUpdates);
  return userUpdates;
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };
