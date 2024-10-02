import {IMessageClass} from "./types/message.types";
import {AnyMessageContent, delay} from "@whiskeysockets/baileys";
import {SocketType} from "./types/socket.type";

export default class MessageController implements  IMessageClass{
    private static instance: MessageController
    private socket: SocketType

    constructor(socket: SocketType) {
        this.socket = socket;
    }

    public static init(socket: SocketType): MessageController {
        if(!MessageController.instance){
            MessageController.instance = new MessageController(socket);
        }
        return this.instance;
    }

    async  sendTyping(msg:AnyMessageContent, jid:string){
        await this.socket.presenceSubscribe(jid);
        await delay(200);
        await this.socket.sendPresenceUpdate("composing", jid);
        await delay(2000);
        await this.socket.sendPresenceUpdate("paused", jid);
        await this.socket.sendMessage(jid, msg);
    }
}