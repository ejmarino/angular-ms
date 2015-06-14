/// <reference path="typings/angularjs/angular.d.ts" />
declare module ngms {
    interface IMessageService {
        getChannel(channelName: string): IChannel;
        getTopic(channelName: string, topicName: string): ITopic;
        subscribeAllChannels(callback: ICallback): IToken;
        subscribeAllChannelsOneTime(callback: ICallback): IToken;
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
        getDefaultTopic(): ITopic;
        getTopic(name: string): ITopic;
        publishSync(topicName: string, message?: string | IMessage): void;
        publish(topicName: string, message?: string | IMessage): ng.IPromise<void>;
        subscribe(topicName: string, callback: ICallback): IToken;
        subscribeOneTime(topicName: string, callback: ICallback): IToken;
        unsubscribe(token: IToken): void;
        unsubscribeAll(): void;
    }
    interface ITopic {
        getName(): string;
        getChannelName(): string;
        publishSync(message?: string | IMessage): void;
        publish(message?: string | IMessage): ng.IPromise<void>;
        subscribe(callback: ICallback): IToken;
        unsubscribe(token: IToken): void;
        unsubscribeAll(): void;
    }
    interface ICallback {
        (message: IMessage, topicName?: string, channelName?: string): void;
    }
}
declare module ngms {
}
