var ngms;
(function (ngms) {
    'use strict';
})(ngms || (ngms = {}));
var ngms;
(function (ngms) {
    'use strict';
    var ng = angular.module('ngms', []);
    var Channel = (function () {
        function Channel(channelName, messageService) {
            this.$subscriptions = {};
            this.$messageService = messageService;
            this.$channelName = channelName;
        }
        Channel.prototype.getName = function () {
            return this.$channelName;
        };
        Channel.prototype.publishSync = function (message) {
            this.$messageService.publishSync(this.$channelName, message);
        };
        Channel.prototype.publish = function (message) {
            return this.$messageService.publish(this.$channelName, message);
        };
        Channel.prototype.subscribe = function (callback, oneTime) {
            var token = this.$messageService.subscribe(this.$channelName, callback, oneTime);
            this.$subscriptions[token.tokenId] = token;
            return token;
        };
        Channel.prototype.unsubscribeAll = function () {
            for (var tokenId in this.$subscriptions) {
                this.unsubscribe(this.$subscriptions[tokenId]);
            }
            this.$subscriptions = {};
        };
        Channel.prototype.unsubscribe = function (token) {
            if (!token) {
                return;
            }
            if (token.channelName !== this.$channelName) {
                throw new Error('You can only unsubscribe tokens related to channel ' + this.$channelName);
            }
            this.$messageService.unsubscribe(token);
            delete this.$subscriptions[token.tokenId];
        };
        return Channel;
    })();
    var Registry = (function () {
        function Registry($timeout, $q) {
            this.$simpleSubscribers = {};
            this.$patternSubscribers = {};
            this.$patternRegex = {};
            this.$allSubscribers = [];
            this.$timeout = $timeout;
            this.$q = $q;
        }
        Registry.prototype.getSimpleSubs = function (channelName) {
            this.$simpleSubscribers[channelName] = this.$simpleSubscribers[channelName] || [];
            return this.$simpleSubscribers[channelName];
        };
        Registry.prototype.getPatternSubs = function (channelPattern) {
            this.$patternSubscribers[channelPattern] = this.$patternSubscribers[channelPattern] || [];
            return this.$patternSubscribers[channelPattern];
        };
        Registry.prototype.publishSync = function (channelName, message) {
            var subs = this.getSubscriptions(channelName);
            this.$publish(subs, message, channelName, this);
        };
        Registry.prototype.publish = function (channelName, message) {
            var self = this;
            var subs = this.getSubscriptions(channelName);
            var defer = this.$q.defer();
            self.$timeout(function () {
                try {
                    self.$publish(subs, message, channelName, self);
                    defer.resolve();
                }
                catch (e) {
                    defer.reject(e);
                }
            }, 0);
            return defer.promise;
        };
        Registry.prototype.$publish = function (subscriptions, message, channelName, self) {
            subscriptions.forEach(function (subscriber) {
                subscriber.callback(message, channelName);
                if (subscriber.oneTime) {
                    self.removeToken(subscriber.token);
                }
            });
        };
        Registry.prototype.subscribe = function (channelName, callback, oneTime) {
            var self = this;
            var subs;
            var sub;
            var tokenId = this.generateUUID();
            var token = {
                channelName: channelName,
                tokenId: tokenId
            };
            sub = { token: token, callback: callback, oneTime: !!oneTime };
            if (channelName === '*') {
                subs = this.$allSubscribers;
            }
            else if (channelName.indexOf('*') === -1) {
                subs = this.getSimpleSubs(channelName);
            }
            else {
                sub.oneTime = false;
                var regexp = this.$patternRegex[channelName];
                if (!regexp) {
                    regexp = new RegExp(channelName.replace(/\*/g, '.*').replace(/\./g, '\\.'), 'i');
                    this.$patternRegex[channelName] = regexp;
                }
                subs = this.getPatternSubs(channelName);
                sub.matchedChannels = this.getMatchedChannels(regexp);
                sub.matchedChannels.forEach(function (channelName) {
                    var ssubs = self.getSimpleSubs(channelName);
                    ssubs.push(sub);
                });
            }
            subs.push(sub);
            return token;
        };
        Registry.prototype.getMatchedChannels = function (regexp) {
            return Object.keys(this.$simpleSubscribers).filter(function (channelName) {
                return regexp.test(channelName);
            });
        };
        Registry.prototype.getSubscriptions = function (channelName) {
            var subs = angular.copy(this.getSimpleSubs(channelName));
            if (subs.length === 0) {
                var psubs = this.getMatchedPatSubs(channelName);
                psubs.forEach(function (psub) {
                    psub.matchedChannels.push(channelName);
                    subs.push(psub);
                });
            }
            if (this.$allSubscribers.length > 0) {
                return subs.concat(this.$allSubscribers);
            }
            else {
                return subs;
            }
        };
        Registry.prototype.getMatchedPatSubs = function (channelName) {
            var _this = this;
            var result = [];
            Object.keys(this.$patternSubscribers).forEach(function (patternName) {
                var regexp = _this.$patternRegex[patternName];
                if (regexp.test(channelName)) {
                    result = result.concat(_this.$patternSubscribers[patternName]);
                }
            });
            return result;
        };
        Registry.prototype.removeToken = function (token) {
            var self = this;
            var subs;
            if (token.channelName === '*') {
                subs = this.$allSubscribers;
            }
            else if (token.channelName.indexOf('*') === -1) {
                subs = this.getSimpleSubs(token.channelName);
            }
            else {
                var psubs = this.getPatternSubs(token.channelName);
                var newPList = psubs.filter(function (psub) {
                    if (psub.token.tokenId === token.tokenId) {
                        psub.matchedChannels.forEach(function (channelName) {
                            self.removeToken({ channelName: channelName, tokenId: psub.token.tokenId });
                        });
                        return false;
                    }
                    return true;
                });
                if (newPList.length === 0) {
                    delete this.$simpleSubscribers[token.channelName];
                }
                else {
                    this.$patternSubscribers[token.channelName] = newPList;
                }
                return;
            }
            var newList = subs.filter(function (subscriber) {
                return subscriber.token.tokenId !== token.tokenId;
            });
            if (newList.length === 0) {
                delete this.$simpleSubscribers[token.channelName];
            }
            else {
                this.$simpleSubscribers[token.channelName] = newList;
            }
        };
        Registry.prototype.generateUUID = function () {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        };
        return Registry;
    })();
    var MessageService = (function () {
        function MessageService($timeout, $q) {
            this.$registry = new Registry($timeout, $q);
        }
        MessageService.$inject = ["$timeout", "$q"];
        MessageService.prototype.getChannel = function (channelName) {
            return new Channel(channelName, this);
        };
        MessageService.prototype.publishSync = function (channelName, message) {
            if (channelName.indexOf('*') !== -1) {
                throw new Error('Invalid channel name. You must specify a channel name without wilcards.');
            }
            var msg = this.$ensureMessage(message);
            return this.$registry.publishSync(channelName, msg);
        };
        MessageService.prototype.publish = function (channelName, message) {
            if (channelName.indexOf('*') !== -1) {
                throw new Error('Invalid channel name. You must specify a channel name without wilcards.');
            }
            var msg = this.$ensureMessage(message);
            return this.$registry.publish(channelName, msg);
        };
        MessageService.prototype.$ensureMessage = function (message) {
            var msg;
            if (!message) {
                msg = { $msgId: '' };
            }
            else if (typeof message === 'string') {
                msg = { data: message, $msgId: this.$registry.generateUUID() };
            }
            else {
                msg = message;
                msg.$msgId = this.$registry.generateUUID();
            }
            return msg;
        };
        MessageService.prototype.subscribe = function (channelName, callback, oneTime) {
            return this.$registry.subscribe(channelName, callback, oneTime);
        };
        MessageService.prototype.unsubscribe = function (token) {
            this.$registry.removeToken(token);
        };
        MessageService.prototype.getServiceStats = function () {
            var stats = {};
            var self = this;
            stats.simpleChannels = Object.keys(this.$registry.$simpleSubscribers).length;
            stats.patternChannels = Object.keys(this.$registry.$patternSubscribers).length;
            stats.globalSubscriptions = this.$registry.$allSubscribers.length;
            stats.totalSubscriptions = 0;
            stats.channels = [];
            Object.keys(this.$registry.$simpleSubscribers).forEach(function (channelName) {
                var subs = self.$registry.$simpleSubscribers[channelName];
                var chStat = {};
                chStat.name = channelName;
                chStat.totalSubscriptions = subs.length;
                stats.totalSubscriptions += chStat.totalSubscriptions;
                stats.channels.push(chStat);
            });
            stats.totalButGlobalSubscriptions = stats.totalSubscriptions;
            stats.totalSubscriptions += this.$registry.$allSubscribers.length;
            stats.patternSubscriptions = 0;
            stats.patternChannels = [];
            Object.keys(this.$registry.$patternSubscribers).forEach(function (channelPattern) {
                var psubs = self.$registry.$patternSubscribers[channelPattern];
                var psStat = {};
                psStat.name = channelPattern;
                psStat.totalSubscriptions = psubs.length;
                psStat.channelsMatched = psubs[0].matchedChannels;
                stats.patternSubscriptions += psStat.totalSubscriptions;
                stats.patternSubscriptions.push(psStat);
            });
            return stats;
        };
        return MessageService;
    })();
    ng.service('ngmsMessageService', MessageService);
})(ngms || (ngms = {}));
