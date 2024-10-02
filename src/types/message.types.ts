import {AnyMessageContent} from "@whiskeysockets/baileys";

export interface IMessageClass {
    sendTyping: (msg:AnyMessageContent, jid: string)  => Promise<void>
}