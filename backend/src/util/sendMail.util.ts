import resend from "../config/resend.js";
import env from "../config/env.js";

type Params = {
    to: string,
    subject: string,
    text: string,
    html: string,
};

const getFromEmail = () => 
    env.NODE_ENV === "development" ? "onboarding@resend.dev" : env.EMAIL_SENDER;

const getToEmail = (to: string) => 
    env.NODE_ENV === "development" ? "delivered@resend.dev" : to;

export const sendMail = async ({ to, subject, text, html }: Params) => {

    return await resend.emails.send({
        from: getFromEmail(),
        to: getToEmail(to),
        subject,
        text,
        html,
    }); 
};




