/** Which optional integrations are configured. Lets the UI hide options that can't work yet. */
export const emailReady = () => (!!process.env.MAILGUN_API_KEY && !!process.env.MAILGUN_DOMAIN) || (!!process.env.BREVO_API_KEY && !!process.env.BREVO_SENDER_EMAIL);
export const googleReady = () => !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;
