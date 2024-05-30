import { Boom } from "@hapi/boom";
import makeWASocket, {
    AnyMessageContent,
    DisconnectReason,
    delay,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";

const StartApp = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(
        "../auth/baileys_auth"
    );
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
    const sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: state,
        generateHighQualityLinkPreview: true,
    });

    sock.ev.on("connection.update", (update) => {
        const { lastDisconnect, connection, qr } = update;
        if (qr && connection === "connecting")
            qrcode.generate(qr, { small: true });
        if (connection === "close") {
            const shouldReconnect =
                (lastDisconnect?.error as Boom)?.output?.statusCode !==
                DisconnectReason.loggedOut;
            console.log(
                "connection closed due to ",
                lastDisconnect?.error,
                ", reconnecting ",
                shouldReconnect
            );
            process.exit(0);
        } else if (connection === "open") console.log("opened connection");
    });

    const sendMessageWTyping = async (msg: AnyMessageContent, jid: string) => {
        await sock.presenceSubscribe(jid);
        await delay(200);

        await sock.sendPresenceUpdate("composing", jid);
        await delay(2000);

        await sock.sendPresenceUpdate("paused", jid);

        await sock.sendMessage(jid, msg);
    };

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("messages.upsert", (msg) => {
        msg.messages.forEach(async (message) => {
            if (!message.key.fromMe) {
                const id = message.key.remoteJid;
                if (!id) return;
                await sendMessageWTyping({ text: "Hello World from bot" }, id);
            }
        });
    });
};

StartApp();
