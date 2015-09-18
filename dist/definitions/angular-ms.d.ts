/// <reference path="typings/angularjs/angular.d.ts" />
declare module ngms {
    interface IMessageService {
        getChannel(channelName: string): IChannel;
        publishSync(channelName: string, message?: string | IMessage): void;
        publish(channelName: string, message?: string | IMessage): ng.IPromise<any>;
        subscribe(channelName: string, callback: ICallback, oneTime?: boolean): IToken;
        unsubscribe(token: IToken): void;
        getServiceStats(): any;
    }
    interface IMessage {
        [index: string]: any;
        $msgId?: string;
    }
    interface IToken {
        channelName: string;
        tokenId: string;
    }
    interface IChannel {
        getName(): string;
        publishSync(message?: string | IMessage): void;
        publish(message?: string | IMessage): ng.IPromise<any>;
        subscribe(callback: ICallback, oneTime?: boolean): IToken;
        unsubscribe(token: IToken): void;
        unsubscribeAll(): void;
    }
    interface ICallback {
        (message: IMessage, channelName?: string): void;
    }
}
declare module ngms {
}
