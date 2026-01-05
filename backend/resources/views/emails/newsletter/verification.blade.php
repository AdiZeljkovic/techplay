<!DOCTYPE html>
<html>

<head>
    <title>Verify Subscription</title>
</head>

<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333;">Confirm your subscription</h2>
        <p>Hello,</p>
        <p>Thanks for subscribing to our newsletter! Please click the button below to verify your email address and
            start receiving updates.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $verificationUrl }}"
                style="background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verify Email
            </a>
        </div>

        <p>If you didn't sign up for this, you can safely ignore this email.</p>
        <br>
        <p>Best regards,<br>TechPlay Team</p>
    </div>
</body>

</html>