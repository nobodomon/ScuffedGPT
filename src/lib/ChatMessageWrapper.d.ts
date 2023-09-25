/**
 *
 * @export
 * @interface ChatMessageWrapper
 */
export interface ChatMessageWrapper extends ChatCompletionRequest{
    /**
     * The role of the author of this message.
     * @type {string}
     * @memberof ChatCompletionRequestMessage
     */
    'role': ChatCompletionRequestMessageRoleEnum;
    /**
     * The contents of the message
     * @type {string}
     * @memberof ChatCompletionRequestMessage
     */
    'content': string;
    /**
     * The name of the user in a multi-user chat
     * @type {string}
     * @memberof ChatCompletionRequestMessage
     */
    'name'?: string;
    /**
     * The Profile Pic of the user
     * @type {string}
     * @memberof ChatCompletionRequestMessage
     */
    'profilePic'?: string;
}