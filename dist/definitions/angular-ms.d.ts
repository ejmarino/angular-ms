/// <reference path="typings/angularjs/angular.d.ts" />
declare module ngms {
    interface IMessageService {
        getChannel(channelName: string): IChannel;
        getTopic(channelName: string, topicName: string): ITopic;
        subscribeAllChannels(callback: (message: IMessage, topicName?: string, channelName?: string) => void): IToken;
        unsubscribeAllChannels(token: IToken): void;
        getRegistryStats(): any;
    }
    interface IMessage {
        [index: string]: any;
        $msgId?: string;
    }
    interface IToken {
        channelName: string;
        topicName: string;
        tokenId: string;
    }
    interface IChannel {
        getName(): string;
        getTopic(name: string): ITopic;
        publish(topicName: string, message: string | IMessage): void;
        subscribe(topicName: string, callback: (message: IMessage, topicName?: string, channelName?: string) => void): IToken;
        unsubscribe(token: IToken): void;
        unsubscribeAll(): void;
    }
    interface ITopic {
        getName(): string;
        getChannelName(): string;
        publish(message: string | IMessage): void;
        subscribe(callback: (message: IMessage, topicName?: string, channelName?: string) => void): IToken;
        unsubscribe(token: IToken): void;
        unsubscribeAll(): void;
    }
    interface ISubscription {
        token: IToken;
        callback: (message: IMessage, topicName: string, channelName: string) => void;
    }
}
