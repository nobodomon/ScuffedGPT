import type { Message } from "ai";

/**
 *
 * @export
 * @interface ChatMessageWrapper
 */
export interface ChatMessageWrapper extends Message{
    /**
     * The role of the author of this message.
     * @type {string}
     * @memberof Message
     */
    'role': ChatCompletionRequestMessageRoleEnum;
    /**
     * The contents of the message
     * @type {string}
     * @memberof Message
     */
    'content': string;
    /**
     * The name of the user in a multi-user chat
     * @type {string | any[]}
     * @memberof Message
     */
    'name'?: string;
    /**
     * The Profile Pic of the user
     * @type {string}
     * @memberof Message
     */
    'profilePic'?: string;

    'imageReference'?: any[];
}