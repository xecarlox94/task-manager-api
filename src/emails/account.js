const sgMail = require("@sendgrid/mail")


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "andrew@mead.io",
        subject: "Thanks for joining in!",
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "andrew@mead.io",
        subject: `Goodbye, ${name}`,
        text: "PLease let me know if there is something we can do for you"
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}