import twilio from "twilio";

export const sendDueMessage = async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: "Phone and message are required" });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    const client = twilio(accountSid, authToken);

    const msg = await client.messages.create({
      body: message,
      from: fromPhone,
      to: phone,
    });

    res.status(200).json({ success: true, sid: msg.sid });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};
