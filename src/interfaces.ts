/// <reference path="../typings/angularjs/angular.d.ts" />

module ngms {
  'use strict';

  export interface IMessageService {
    getChannel(channelName: string): IChannel;
    publishSync(channelName: string, message?: string | IMessage): void;
    publish(channelName: string, message?: string | IMessage): ng.IPromise<any>;
    subscribe(channelName: string, callback: ICallback, oneTime?: boolean): IToken;
    unsubscribe(token: IToken): void;
    getServiceStats(): any;
  }

  export interface IMessage {
    [index: string]: any;
    $msgId?: string;
  }

  export interface IToken {
    channelName: string;
    tokenId: string;
  }

  export interface IChannel {
    getName(): string;
    publishSync(message?: string | IMessage): void;
    publish(message?: string | IMessage): ng.IPromise<any>;
    subscribe(callback: ICallback, oneTime?: boolean): IToken;
    unsubscribe(token: IToken): void;
    unsubscribeAll(): void;
  }

  export interface ICallback {
    (message: IMessage, channelName?: string): void;
  }

}
