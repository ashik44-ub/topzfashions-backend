const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"Topz Fashions" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <div style="background-color: #f8f9fa; padding: 25px; text-align: center; border-bottom: 3px solid #ff4d4d;">
                <img src="https://your-logo-link.com/logo.png" alt="Topz Fashions" style="max-width: 150px; height: auto;">
            </div>

            <div style="padding: 30px; background-color: #ffffff; text-align: center;">
                <h2 style="color: #333; margin-bottom: 10px; font-size: 22px;">Account Verification</h2>
                <p style="color: #666; font-size: 15px; line-height: 1.5;">Welcome to <b>Topz Fashions</b>! Use the verification code below to confirm your identity.</p>
                
                <div style="margin: 30px 0;">
                    <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ff4d4d; background: #fff5f5; padding: 10px 20px; border: 2px dashed #ff4d4d; border-radius: 8px;">
                        ${options.otp}
                    </span>
                </div>

                <p style="color: #999; font-size: 13px; margin-top: 20px;">
                    This code is valid for <span style="color: #ff4d4d; font-weight: bold;">3 minutes</span> only. <br>
                    If you didn't request this, please ignore this email.
                </p>
            </div>

            <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 11px; color: #888;">
                <p style="margin: 5px 0;">&copy; 2026 Topz Fashions | Dhaka, Bangladesh</p>
                <div style="margin-top: 10px;">
                    <a href="#" style="color: #ff4d4d; text-decoration: none; margin: 0 5px;">Privacy Policy</a> | 
                    <a href="#" style="color: #ff4d4d; text-decoration: none; margin: 0 5px;">Support</a>
                </div>
            </div>
        </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;