/// <reference path="../typings/angularjs/angular.d.ts" />

module ngms {
  'use strict';

  var ng = angular.module('ngms', []);

  export interface IMessageService {
    getChannel(channelName: string): IChannel;
    getTopic(channelName: string, topicName: string): ITopic;
  }

  export interface IMessage {
    msgId?: string;
    data: any;
  }

  export interface IToken {
    channelName: string;
    topicName: string;
    tokenId: string;
  }

  export interface IChannel {
    getName(): string;
    getTopic(name: string): ITopic;
    publish(topicName: string, message: string | IMessage): void;
    subscribe(topicName: string, callback: (message: IMessage, topicName?: string, channelName?: string) => boolean): IToken;
    unsubscribe(token: IToken): void;
    unsubscribeAll(): void;
  }

  export interface ITopic {
    getName(): string;
    getChannelName(): string;
    publish(message: string | IMessage): void;
    subscribe(callback: (message: IMessage, topicName?: string, channelName?: string) => boolean): IToken;
    unsubscribe(token: IToken): void;
    unsubscribeAll(): void;
  }

  export interface ISubscription {
    token: IToken;
    callback: (message: IMessage, topicName: string, channelName: string) => boolean;
  }

  class Topic implements ITopic {
    private channel: Channel;
    private topicName: string;

    public constructor(channel: Channel, topicName: string) {
      this.channel = channel;
      this.topicName = topicName;
    }

    public getName(): string {
      return this.topicName;
    }

    public getChannelName(): string {
      return this.channel.getName();
    }

    public publish(message: string | IMessage): void {
      this.channel.publish(this.topicName, message);
    }

    public subscribe(callback: (message: IMessage, topicName?: string, channelName?: string) => boolean): IToken {
      return this.channel.subscribe(this.topicName, callback);
    }

    public unsubscribe(token: IToken): void {
      this.channel.unsubscribe(token);
    }

    public unsubscribeAll(): void {
      var reg = this.channel.getRegistry();
      var subs = reg.getChannelSubs(this.channel.getName());
      subs[this.topicName] = [];
    }

  }

  class Channel implements IChannel {
    private registry: Registry;
    private subscriptions: { [tokenId: string]: IToken } = {};
    private channelName: string;

    public constructor(channelName: string, registry: Registry) {
      this.registry = registry;
      this.channelName = channelName;
    }

    public getRegistry(): Registry {
      return this.registry;
    }

    public getName() {
      return this.channelName;
    }

    public getTopic(topicName: string) {
      return new Topic(this, topicName);
    }

    public publish(topicName: string, message: string | IMessage) {
      var msg: IMessage;
      var channelName = this.channelName;
      if (typeof message === 'string') {
        msg = { data: message, msgId: this.registry.generateUUID() };
      } else {
        msg = message;
      }
      var subs = this.registry.getTopicSubs(this.channelName, topicName);
      var newList = subs.filter(function(subscriber: ISubscription) {
        var retval = subscriber.callback(msg, topicName, channelName);
        return !retval;
      });
      this.registry.subscribers[this.channelName][topicName] = newList;
    }

    public subscribe(topicName: string, callback: (message: IMessage, topicName?: string, channelName?: string) => boolean) {
      var tokenId = this.registry.generateUUID();
      var subs = this.registry.getTopicSubs(this.channelName, topicName);
      var token: IToken = {
        channelName: this.channelName,
        topicName: topicName,
        tokenId: tokenId
      };
      subs.push({
        token: token,
        callback: callback
      });
      this.subscriptions[tokenId] = token;
      return token;
    }

    public unsubscribeAll() {
      for (var tokenId in this.subscriptions) {
        this.unsubscribe(this.subscriptions[tokenId]);
      }
      this.subscriptions = {};
    }

    public unsubscribe(token: IToken) {
      if (!token) { return; }
      var subs = this.registry.getTopicSubs(this.channelName, token.topicName);
      var newList = subs.filter(function(subscriber: ISubscription) {
        return subscriber.token.tokenId !== token.tokenId;
      });
      delete this.subscriptions[token.topicName];
      if (newList.length === 0) {
        delete this.registry.subscribers[this.channelName][token.topicName];
      } else {
        this.registry.subscribers[this.channelName][token.topicName] = newList;
      }
      if (Object.keys(this.registry.subscribers[this.channelName]).length === 0) {
        delete this.registry.subscribers[this.channelName];
      }
    }
  }

  class Registry {
    public subscribers: { [channelName: string]: { [topicName: string]: ISubscription[] } } = {};

    public getChannelSubs(channelName: string): { [topicName: string]: ISubscription[] } {
      this.subscribers[channelName] = this.subscribers[channelName] || {};
      return this.subscribers[channelName];
    }

    public getTopicSubs(channelName: string, topicName: string): ISubscription[] {
      var channel = this.getChannelSubs(channelName);
      channel[topicName] = channel[topicName] || [];
      return channel[topicName];
    }

    public generateUUID() {
      var d = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c: string) {
        /* tslint:disable:no-bitwise */
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        /* tslint:enable:no-bitwise */
      });
      return uuid;
    }
  }

  class MessageService implements IMessageService {
    private registry: Registry = new Registry();

    public getChannel(channelName: string): IChannel {
      return new Channel(channelName, this.registry);
    }

    public getTopic(channelName: string, topicName: string): ITopic {
      return new Channel(channelName, this.registry).getTopic(topicName);
    }
  }

  ng.service('ngmsMessageService', MessageService);
}
