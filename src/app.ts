import { Boom } from "@hapi/boom";
import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import {SocketType} from "./types/socket.type";

const StartApp = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(
        "auth"
    );
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
    console.log(state);
    const sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: state,
        generateHighQualityLinkPreview: true,
    }) as SocketType;

    const Message = require('./Message.class').default.init(sock);

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

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("messages.upsert", (msg) => {
        msg.messages.forEach(async (message) => {
            if (!message.key.fromMe) {
                const id = message.key.remoteJid;
                if (!id) return;
                await Message.sendTyping({ text: "Hello World from bot" }, id);
            }
        });
    });
};

StartApp();
