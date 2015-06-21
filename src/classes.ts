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

  interface IPatternSubscription extends ISubscription {
    matchedChannels: string[];
  }

  class Channel implements IChannel {
    private $messageService: MessageService;
    private $subscriptions: { [tokenId: string]: IToken } = {};
    private $channelName: string;

    public constructor(channelName: string, messageService: MessageService) {
      this.$messageService = messageService;
      this.$channelName = channelName;
    }

    public getName() {
      return this.$channelName;
    }

    public publishSync(message?: string | IMessage): void {
      this.$messageService.publishSync(this.$channelName, message);
    }

    public publish(message: string | IMessage): ng.IPromise<void> {
      return this.$messageService.publish(this.$channelName, message);
    }

    public subscribe(callback: ICallback, oneTime?: boolean): IToken {
      var token = this.$messageService.subscribe(this.$channelName, callback, oneTime);
      this.$subscriptions[token.tokenId] = token;
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
      this.$messageService.unsubscribe(token);
      delete this.$subscriptions[token.tokenId];
    }
  }

  class Registry {

    public $simpleSubscribers: { [channelName: string]: ISubscription[] } = {};
    public $patternSubscribers: { [channelPattern: string]: IPatternSubscription[] } = {};
    public $patternRegex: { [channelPattern: string]: RegExp } = {};
    public $allSubscribers: ISubscription[] = [];

    private $timeout: ng.ITimeoutService;
    private $q: ng.IQService;

    public constructor($timeout: ng.ITimeoutService, $q: ng.IQService) {
      this.$timeout = $timeout;
      this.$q = $q;
    }

    public getSimpleSubs(channelName: string): ISubscription[] {
      this.$simpleSubscribers[channelName] = this.$simpleSubscribers[channelName] || [];
      return this.$simpleSubscribers[channelName];
    }

    public getPatternSubs(channelPattern: string): IPatternSubscription[] {
      this.$patternSubscribers[channelPattern] = this.$patternSubscribers[channelPattern] || [];
      return this.$patternSubscribers[channelPattern];
    }

    public publishSync(channelName: string, message: IMessage): void {
      var subs = this.getSubscriptions(channelName);
      this.$publish(subs,message, channelName, this);
    }

    public publish(channelName: string, message: IMessage): ng.IPromise<any> {
      var self = this;
      var subs = this.getSubscriptions(channelName);
      var defer = this.$q.defer();

      self.$timeout(() => {
        try {
          self.$publish(subs,message, channelName, self);
          defer.resolve();
        } catch (e) {
          defer.reject(e);
        }
      }, 0);
      return defer.promise;
    }

    private $publish(subscriptions: ISubscription[], message: IMessage, channelName: string, self: Registry) {
      subscriptions.forEach((subscriber: ISubscription) => {
        subscriber.callback(message, channelName);
        if (subscriber.oneTime) {
          self.removeToken(subscriber.token);
        }
      });
    }

    public subscribe(channelName: string, callback: ICallback, oneTime?: boolean): IToken {
      var self = this;
      var subs: ISubscription[];
      var sub: ISubscription;
      var tokenId = this.generateUUID();
      var token: IToken = {
        channelName: channelName,
        tokenId: tokenId
      };
      sub = { token: token, callback: callback, oneTime: !!oneTime };
      if (channelName === '*') {
        // all-Channels Channel Name
        subs = this.$allSubscribers;
      } else if (channelName.indexOf('*') === -1) {
        // single Channel Name
        subs = this.getSimpleSubs(channelName);
      } else {
        // pattern Matching Channel Name
        sub.oneTime = false;
        var regexp = this.$patternRegex[channelName];
        if (!regexp) {
          regexp = new RegExp(channelName.replace(/\*/g, '.*').replace(/\./g, '\\.'), 'i');
          this.$patternRegex[channelName] = regexp;
        }
        subs = this.getPatternSubs(channelName);
        (<IPatternSubscription> sub).matchedChannels = this.getMatchedChannels(regexp);
        (<IPatternSubscription> sub).matchedChannels.forEach((channelName: string) => {
          var ssubs = self.getSimpleSubs(channelName);
          ssubs.push(sub);
        });
      }
      subs.push(sub);
      return token;
    }

    private getMatchedChannels(regexp: RegExp): string[] {
      return Object.keys(this.$simpleSubscribers).filter((channelName: string): boolean => {
        return regexp.test(channelName);
      });
    }

    public getSubscriptions(channelName: string): ISubscription[] {
      var subs = angular.copy(this.getSimpleSubs(channelName));
      if (subs.length === 0) {
        var psubs = this.getMatchedPatSubs(channelName);
        psubs.forEach((psub: IPatternSubscription) => {
          psub.matchedChannels.push(channelName);
          subs.push(psub);
        });
      }
      if (this.$allSubscribers.length > 0) {
        return subs.concat(this.$allSubscribers);
      } else {
        return subs;
      }
    }

    private getMatchedPatSubs(channelName: string): IPatternSubscription[] {
      var result: IPatternSubscription[] = [];
      Object.keys(this.$patternSubscribers).forEach((patternName: string): void => {
        var regexp = this.$patternRegex[patternName];
        if (regexp.test(channelName)) {
          result = result.concat(this.$patternSubscribers[patternName]);
        }
      });
      return result;
    }

    public removeToken(token: IToken): void {
      var self = this;
      var subs: ISubscription[];
      if (token.channelName === '*') {
        // all-Channels Channel Name
        subs = this.$allSubscribers;
      } else if (token.channelName.indexOf('*') === -1) {
        // single Channel Name
        subs = this.getSimpleSubs(token.channelName);
      } else {
        // pattern Matching Channel Name
        var psubs = this.getPatternSubs(token.channelName);
        var newPList = psubs.filter((psub: IPatternSubscription) => {
          if (psub.token.tokenId === token.tokenId) {
            psub.matchedChannels.forEach((channelName: string) => {
              self.removeToken({ channelName: channelName, tokenId: psub.token.tokenId });
            });
            return false;
          }
          return true;
        });
        if (newPList.length === 0) {
          delete this.$simpleSubscribers[token.channelName];
        } else {
          this.$patternSubscribers[token.channelName] = newPList;
        }
        return;
      }
      var newList = subs.filter((subscriber: ISubscription) => {
        return subscriber.token.tokenId !== token.tokenId;
      });
      if (newList.length === 0) {
        delete this.$simpleSubscribers[token.channelName];
      } else {
        this.$simpleSubscribers[token.channelName] = newList;
      }
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
      return new Channel(channelName, this);
    }

    public publishSync(channelName: string, message: string | IMessage): void {
      if (channelName.indexOf('*') !== -1) {
        throw new Error('Invalid channel name. You must specify a channel name without wilcards.');
      }
      var msg = this.$ensureMessage(message);
      return this.$registry.publishSync(channelName, msg);
    }

    public publish(channelName: string, message: string | IMessage): ng.IPromise<void> {
      if (channelName.indexOf('*') !== -1) {
        throw new Error('Invalid channel name. You must specify a channel name without wilcards.');
      }
      var msg = this.$ensureMessage(message);
      return this.$registry.publish(channelName, msg);
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


    public subscribe(channelName: string, callback: ICallback, oneTime?: boolean): IToken {
      return this.$registry.subscribe(channelName, callback, oneTime);
    }

    public unsubscribe(token: IToken) {
      this.$registry.removeToken(token);
    }

    public getServiceStats(): any {
      var stats: any = {};
      var self = this;
      stats.simpleChannels = Object.keys(this.$registry.$simpleSubscribers).length;
      stats.patternChannels = Object.keys(this.$registry.$patternSubscribers).length;
      stats.globalSubscriptions = this.$registry.$allSubscribers.length;
      stats.totalSubscriptions = 0;
      stats.channels = [];
      Object.keys(this.$registry.$simpleSubscribers).forEach((channelName: string) => {
        var subs = self.$registry.$simpleSubscribers[channelName];
        var chStat: any = {};
        chStat.name = channelName;
        chStat.totalSubscriptions = subs.length;
        stats.totalSubscriptions += chStat.totalSubscriptions;
        stats.channels.push(chStat);
      });
      stats.totalButGlobalSubscriptions = stats.totalSubscriptions;
      stats.totalSubscriptions += this.$registry.$allSubscribers.length;
      stats.patternSubscriptions = 0;
      stats.patternChannels = [];
      Object.keys(this.$registry.$patternSubscribers).forEach((channelPattern: string) => {
        var psubs = self.$registry.$patternSubscribers[channelPattern];
        var psStat: any = {};
        psStat.name = channelPattern;
        psStat.totalSubscriptions = psubs.length;
        psStat.channelsMatched = psubs[0].matchedChannels;
        stats.patternSubscriptions += psStat.totalSubscriptions;
        stats.patternSubscriptions.push(psStat);
      });

      return stats;
    }
  }

  ng.service('ngmsMessageService', MessageService);
}
