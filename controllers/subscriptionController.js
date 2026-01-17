const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Business = require('../models/Business');

// CREAR SESIÓN DE PAGO
exports.createCheckoutSession = async (req, res) => {
    try {
        const { priceId, userId } = req.body;

        if (!priceId) return res.status(400).json({ error: 'Falta priceId' });
        
        // Si no mandan userId en body, intentamos sacarlo del token (req.user) si usas middleware auth
        const idUsuario = userId || (req.user ? req.user.id : null);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription', // o 'payment' si es pago único
            // METADATOS CLAVE: Aquí guardamos quién está pagando
            metadata: {
                userId: idUsuario,
                planType: 'partner_yearly'
            },
            client_reference_id: idUsuario, 
            // Redirigimos a una URL que ejecutará la verificación
            success_url: `${req.protocol}://${req.get('host')}/api/subscriptions/verify-payment?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/admin?payment=cancelled`,
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// VERIFICAR PAGO Y ACTUALIZAR DB (Callback de Stripe)
exports.verifyPayment = async (req, res) => {
    try {
        const { session_id } = req.query;

        if (!session_id) return res.redirect('/admin?error=no_session');

        // 1. Preguntamos a Stripe el estado real de esa sesión
        const session = await stripe.checkout.sessions.retrieve(session_id);

        // 2. Verificamos si pagó
        if (session.payment_status === 'paid') {
            const userId = session.metadata.userId || session.client_reference_id;
            
            // 3. ACTUALIZAMOS LA BASE DE DATOS
            // Obtenemos el User para acceder a su businessId
            const user = await User.findById(userId);
            
            if (!user || !user.businessId) {
                return res.redirect('/admin?error=user_or_business_not_found');
            }
            
            // Actualizamos el plan en el modelo Business
            await Business.findByIdAndUpdate(user.businessId, {
                plan: 'pro',
                subscriptionStatus: 'active',
                subscriptionId: session.subscription,
                updatedAt: new Date()
            });

            // 4. Redirigimos al Dashboard con éxito
            return res.redirect('/admin?payment=success&welcome=true');
        } else {
            return res.redirect('/admin?payment=failed');
        }

    } catch (error) {
        console.error("Error verificando pago:", error);
        return res.redirect('/admin?error=verification_failed');
    }
};