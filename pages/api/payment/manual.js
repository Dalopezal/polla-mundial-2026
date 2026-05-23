import { requireAuth } from '../../../lib/auth';
import { db } from '../../../lib/db';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { referencia, comprobante, notas } = req.body;
  // comprobante: número de transacción, referencia de consignación, etc.

  if (!referencia) return res.status(400).json({ error: 'Referencia de pago requerida' });
  if (!comprobante) return res.status(400).json({ error: 'Número de comprobante requerido' });

  const payment = db.payments.findByRef(referencia);
  if (!payment) return res.status(404).json({ error: 'Solicitud de pago no encontrada' });
  if (payment.userId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' });
  if (payment.estado !== 'pendiente') return res.status(400).json({ error: `El pago ya está en estado: ${payment.estado}` });

  const updated = db.payments.update(payment.id, {
    estado:      'pendiente_validacion',
    comprobante: comprobante.trim(),
    notas:       notas?.trim() || '',
    enviadoEn:   new Date().toISOString(),
  });

  db.users.update(req.user.id, { estado: 'pendiente_aprobacion' });

  return res.status(200).json({ ok: true, payment: updated });
}

export default requireAuth(handler);
