import { requireAdmin } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
import { aprobarPago } from '../../payment/wompi-webhook';
import { PLANES } from '../../../../lib/payments';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { estado } = req.query;
    let payments = db.payments.getAll();
    if (estado && estado !== 'todos') {
      payments = payments.filter(p => p.estado === estado);
    }
    // Enriquecer con datos del usuario
    payments = payments.map(p => {
      const user = db.users.findById(p.userId);
      return { ...p, userName: user?.name || p.userName, userEmail: user?.email || p.userEmail };
    });
    payments.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));

    const resumen = db.stats.getResumen();
    return res.status(200).json({ payments, resumen });
  }

  if (req.method === 'POST') {
    const { paymentId, accion, notas } = req.body;
    if (!paymentId || !accion) return res.status(400).json({ error: 'paymentId y accion requeridos' });

    const payment = db.payments.findById(paymentId);
    if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });

    if (accion === 'aprobar') {
      const result = aprobarPago(payment, { aprobadoPor: req.user.id, notas }, 'admin_manual');
      return res.status(200).json({ ok: true, resultado: result });
    }

    if (accion === 'rechazar') {
      db.payments.update(paymentId, {
        estado:       'rechazado',
        notas:        notas || '',
        rechazadoPor: req.user.id,
        rechazadoEn:  new Date().toISOString(),
      });
      db.users.update(payment.userId, { estado: 'rechazado' });
      return res.status(200).json({ ok: true });
    }

    // Activar IA adicional (si usuario pagó upgrade de $20.000)
    if (accion === 'activar_ia') {
      const { monto } = req.body;
      const user = db.users.findById(payment.userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      db.users.update(user.id, {
        incluye_ia: true,
        saldoIA: (user.saldoIA || 0) + (monto || 20000),
      });
      db.payments.update(paymentId, { estado: 'aprobado', tipo_upgrade: 'ia', upgradeMonto: monto });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Acción inválida' });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

export default requireAdmin(handler);
