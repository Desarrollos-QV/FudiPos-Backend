const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');  
const Business = require('../models/Business');  

// 1. Crear la cuenta de Stripe para el Negocio (Connected Account)
exports.createConnectAccount = async (req, res) => {
    try {
        const { userId } = req.body; // O sacado del req.user si usas auth
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        
        const business = await Business.findById(user.businessId);

        // Si ya tiene cuenta, no creamos otra
        if (business.stripeAccountId) {
            return res.json({ accountId: business.stripeAccountId });
        }

        // Creamos una cuenta "Express" (Stripe maneja la UI de los datos bancarios)
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'MX', // O el país donde operes ('US', 'ES', etc.)
            email: user.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: 'company', // O 'individual' dependiendo
        });

        // Guardamos el ID de la cuenta de Stripe en tu BD
        business.stripeAccountId = account.id;
        await business.save();

        res.json({ accountId: account.id });

    } catch (error) {
        console.error("Error creando cuenta Connect:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. Generar el Link de Onboarding (A donde redirigimos al usuario)
exports.createAccountLink = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        
        const business = await Business.findById(user.businessId);

        if (!business || !business.stripeAccountId) {
            return res.status(400).json({ error: 'El usuario no tiene una cuenta de Stripe iniciada.' });
        }

        const accountLink = await stripe.accountLinks.create({
            account: business.stripeAccountId,
            refresh_url: `${req.protocol}://${req.get('host')}/admin/settings?stripe=reauth`, // Si falla o expira
            return_url: `${req.protocol}://${req.get('host')}/admin/settings?stripe=success`, // Cuando terminan
            type: 'account_onboarding',
        });

        res.json({ url: accountLink.url });

    } catch (error) {
        console.error("Error generando link:", error);
        res.status(500).json({ error: error.message });
    }
};

// 3. (Futuro) Ejemplo de cómo cobrarías la comisión en una venta
// Esta función no se llama ahora, es para que veas cómo se aplica la lógica que pides
/*
exports.createPaymentWithCommission = async (req, res) => {
    const { amount, businessStripeId } = req.body;
    
    // Supongamos que la venta es de $100.00 MXN
    // Tú quieres ganar el 5% + $3 pesos fijos por uso de plataforma
    const applicationFee = Math.round(amount * 0.05) + 300; // En centavos

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'mxn',
                product_data: { name: 'Pedido FudiPos' },
                unit_amount: amount, // Monto total (ej. 10000 centavos = $100)
            },
            quantity: 1,
        }],
        mode: 'payment',
        payment_intent_data: {
            application_fee_amount: applicationFee, // AQUÍ ESTÁ TU GANANCIA
            transfer_data: {
                destination: businessStripeId, // AQUÍ VA EL DINERO AL RESTAURANTE
            },
        },
        success_url: '...',
        cancel_url: '...',
    });
}
*/