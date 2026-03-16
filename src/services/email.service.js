const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
    },
});

transporter.verify((error, success) => {
    if(error){
        console.log('Error Connecting to email Server', error);
    }
    else{
        console.log('Email Service is ready to send messages');
    }
});

const sendEmail = async(to , subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Backend-Ledger" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log("Message Sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    }catch(error){
        console.log("Error sending email:", error);
    }
}

async function sendRegisterEmail(userEmail, name){
    const subject = 'Welcome to Backend Ledger!';
    const text = `Hi ${name},\n\nThank you for registering with Backend Ledger! We're excited to have you on board. If you have any questions or need assistance, feel free to reach out to our support team.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hi ${name},</p><p>Thank you for registering with Backend Ledger! We're excited to have you on board. If you have any questions or need assistance, feel free to reach out to our support team.</p><p>Best regards,<br>The Backend Ledger Team</p>`;
    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(to, name, amount, transactionId){
    const subject = 'Transaction Alert from Backend Ledger';
    const text = `Hi ${name},\n\nA transaction of amount ${amount} has been processed with transaction ID: ${transactionId}. If you have any questions or need assistance, feel free to reach out to our support team.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hi ${name},</p><p>A transaction of amount ${amount} has been processed with transaction ID: ${transactionId}. If you have any questions or need assistance, feel free to reach out to our support team.</p><p>Best regards,<br>The Backend Ledger Team</p>`;
    await sendEmail(to, subject, text, html);
}

async function sendTransactionFailureEmail(to, name, amount, transactionId){
    const subject = 'Transaction Failure Alert from Backend Ledger';
    const text = `Hi ${name},\n\nWe regret to inform you that a transaction of amount ${amount} with transaction ID: ${transactionId} has failed. Please check your account and try again. If you have any questions or need assistance, feel free to reach out to our support team.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hi ${name},</p><p>We regret to inform you that a transaction of amount ${amount} with transaction ID: ${transactionId} has failed. Please check your account and try again. If you have any questions or need assistance, feel free to reach out to our support team.</p><p>Best regards,<br>The Backend Ledger Team</p>`;
    await sendEmail(to, subject, text, html);
}

module.exports = {
    sendRegisterEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
}