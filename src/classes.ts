/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="interfaces.ts" />

module ngms {
  'use strict';

  var ng = angular.module('ngms', []);

  interface ISubscription {
    token: IToken;
    callback: ICallback;
    oneTime: boolean;
  }

  class Topic implements ITopic {
    private $channel: Channel;
    private $topicName: string;

    public constructor(channel: Channel, topicName: string) {
      this.$channel = channel;
      this.$topicName = topicName;
    }

    public getName(): string {
      return this.$topicName;
    }

    public getChannelName(): string {
      return this.$channel.getName();
    }

    public publishSync(message: string | IMessage): void {
      this.$channel.publishSync(this.$topicName, message);
    }

    public publish(message: string | IMessage): ng.IPromise<void> {
      return this.$channel.publish(this.$topicName, message);
    }

    public subscribe(callback: ICallback): IToken {
      return this.$channel.subscribe(this.$topicName, callback);
    }

    public unsubscribe(token: IToken): void {
      if (token.topicName !== this.$topicName) {
        throw new Error('You can only unsubscribe tokens related to topic ' + this.$topicName);
      }
      this.$channel.unsubscribe(token);
    }

    public unsubscribeAll(): void {
      var reg = this.$channel.getRegistry();
      var subs = reg.getChannelSubs(this.$channel.getName());
      subs[this.$topicName] = [];
    }

  }

  class Channel implements IChannel {
    private $registry: Registry;
    private $subscriptions: { [tokenId: string]: IToken } = {};
    private $channelName: string;

    public constructor(channelName: string, registry: Registry) {
      this.$registry = registry;
      this.$channelName = channelName;
    }

    public getRegistry(): Registry {
      return this.$registry;
    }

    public getName() {
      return this.$channelName;
    }

    public getDefaultTopic() {
      return new Topic(this, this.$registry.$defaultTopicName);
    }

    public getTopic(topicName: string) {
      return new Topic(this, topicName);
    }

    public publishSync(topicName: string, message?: string | IMessage): void {
      var msg = this.$ensureMessage(message);
      this.$registry.publishSync(this.$channelName, topicName, msg);
    }

    public publish(topicName: string, message: string | IMessage): ng.IPromise<void> {
      var msg = this.$ensureMessage(message);
      return this.$registry.publish(this.$channelName, topicName, msg);
    }

    private $ensureMessage(message: string | IMessage): IMessage {
      var msg: IMessage;
      if (!message) {
        msg = { $msgId: '' };
      } else if (typeof message === 'string') {
        msg = { data: message, $msgId: this.$registry.generateUUID() };
      } else {
        msg = message;
        msg.$msgId = this.$registry.generateUUID();
      }
      return msg;
    }

    public subscribeAll(callback: ICallback): IToken {
      return this.subscribe(this.$registry.$allTopicsName, callback);
    }

    public subscribe(topicName: string, callback: ICallback): IToken {
      return this.$subscribe(topicName, callback, false);
    }
    public subscribeOneTime(topicName: string, callback: ICallback): IToken {
      return this.$subscribe(topicName, callback, true);
    }

    private $subscribe(topicName: string, callback: ICallback, oneTime: boolean): IToken {
      var tokenId = this.$registry.generateUUID();
      var subs = this.$registry.getTopicSubs(this.$channelName, topicName);
      var token: IToken = {
        channelName: this.$channelName,
        topicName: topicName,
        tokenId: tokenId
      };
      subs.push({
        token: token,
        callback: callback,
        oneTime: oneTime
      });
      this.$subscriptions[tokenId] = token;
      return token;
    }

    public unsubscribeAll() {
      for (var tokenId in this.$subscriptions) {
        this.unsubscribe(this.$subscriptions[tokenId]);
      }
      this.$subscriptions = {};
    }

    public unsubscribe(token: IToken) {
      if (!token) { return; }
      if (token.channelName !== this.$channelName) {
        throw new Error('You can only unsubscribe tokens related to channel ' + this.$channelName);
      }
      this.$registry.removeToken(token);
      delete this.$subscriptions[token.tokenId];
    }
  }

  class Registry {
    private $timeout: ng.ITimeoutService;
    private $q: ng.IQService;

    public $allTopicsName: string = '$$all-topics';
    public $allChannelsName: string = '$$all-channels';
    public $defaultTopicName: string = '$$default-topic';

    public $subscribers: { [channelName: string]: { [topicName: string]: ISubscription[] } } = {};

    public constructor($timeout: ng.ITimeoutService, $q: ng.IQService) {
      this.$timeout = $timeout;
      this.$q = $q;
    }

    public getChannelSubs(channelName: string): { [topicName: string]: ISubscription[] } {
      this.$subscribers[channelName] = this.$subscribers[channelName] || {};
      return this.$subscribers[channelName];
    }

    public getTopicSubs(channelName: string, topicName: string): ISubscription[] {
      var channel = this.getChannelSubs(channelName);
      channel[topicName] = channel[topicName] || [];
      return channel[topicName];
    }

    public removeToken(token: IToken): void {
      var subs = this.getTopicSubs(token.channelName, token.topicName);
      var newList = subs.filter(function(subscriber: ISubscription) {
        return subscriber.token.tokenId !== token.tokenId;
      });
      if (newList.length === 0) {
        delete this.$subscribers[token.channelName][token.topicName];
        if (Object.keys(this.$subscribers[token.channelName]).length === 0) {
          delete this.$subscribers[token.channelName];
        }
      } else {
        this.$subscribers[token.channelName][token.topicName] = newList;
      }
    }

    public publishSync(channelName: string, topicName: string, message: IMessage): void {
      var subs = this.$getSubscriptions(channelName, topicName);
      subs.forEach(function(subscriber: ISubscription) {
        subscriber.callback(message, topicName, channelName);
      });
    }

    public publish(channelName: string, topicName: string, message: IMessage): ng.IPromise<void> {
      var subs = this.$getSubscriptions(channelName, topicName);
      var self = this;
      return new this.$q((): void => {
        self.$timeout(() => {
          subs.forEach(function(subscriber: ISubscription) {
            subscriber.callback(message, topicName, channelName);
          });
        }, 0);
      });
    }

    private $getSubscriptions(channelName: string, topicName: string): ISubscription[] {
      var topicSubs = this.getTopicSubs(channelName, topicName);
      var allTopicSubs = this.getTopicSubs(channelName, this.$allTopicsName);
      var allChannelsSubs = this.getTopicSubs(this.$allChannelsName, this.$allTopicsName);
      return topicSubs.concat(allTopicSubs, allChannelsSubs);
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
    private $registry: Registry;

    public constructor($timeout: ng.ITimeoutService, $q: ng.IQService) {
      this.$registry = new Registry($timeout, $q);
    }

    public getChannel(channelName: string): IChannel {
      return new Channel(channelName, this.$registry);
    }

    public getTopic(channelName: string, topicName: string): ITopic {
      return new Channel(channelName, this.$registry).getTopic(topicName);
    }

    public subscribeAllChannelsOneTime(callback: ICallback): IToken {
      return this.$subscribeAllChannels(callback, true);
    }

    public subscribeAllChannels(callback: ICallback): IToken {
      return this.$subscribeAllChannels(callback, false);
    }

    private $subscribeAllChannels(callback: ICallback, oneTime: boolean): IToken {
      var tokenId = this.$registry.generateUUID();
      var subs = this.$registry.getTopicSubs(this.$registry.$allChannelsName, this.$registry.$allTopicsName);
      var token: IToken = {
        channelName: this.$registry.$allChannelsName,
        topicName: this.$registry.$allTopicsName,
        tokenId: tokenId
      };
      subs.push({
        token: token,
        callback: callback,
        oneTime: false
      });
      return token;
    }

    public unsubscribeAllChannels(token: IToken) {
      if (token.channelName !== this.$registry.$allChannelsName && token.topicName !== this.$registry.$allTopicsName) {
        throw new Error('MessageService only allows unsubscribe to all-channels subscriptions');
      }
      this.$registry.removeToken(token);
    }

    public getRegistryStats(): any {
      var stats: any = {};
      var self = this;
      stats.totalChannels = Object.keys(this.$registry.$subscribers).length;
      stats.totalTopics = 0;
      stats.totalSubscriptions = 0;
      stats.channels = [];
      Object.keys(this.$registry.$subscribers).forEach((channelName: string) => {
        var channel = self.$registry.$subscribers[channelName];
        var chStat: any = {};
        chStat.name = channelName;
        chStat.totalTopics = Object.keys(channel).length;
        chStat.totalSubscriptions = 0;
        chStat.topics = [];
        Object.keys(channel).forEach((topicName: string) => {
          var topic = channel[topicName];
          var tpStat: any = {};
          tpStat.name = topicName;
          tpStat.totalSubscriptions = topic.length;
          chStat.totalSubscriptions += topic.length;
          chStat.topics.push(tpStat);
        });
        stats.totalTopics += chStat.totalTopics;
        stats.totalSubscriptions += chStat.totalSubscriptions;
        stats.channels.push(chStat);
      });
      return stats;
    }
  }

  ng.service('ngmsMessageService', MessageService);
}
