var ngms;
(function (ngms) {
    'use strict';
    var ng = angular.module('ngms', []);
    var Topic = (function () {
        function Topic(channel, topicName) {
            this.$channel = channel;
            this.$topicName = topicName;
        }
        Topic.prototype.getName = function () {
            return this.$topicName;
        };
        Topic.prototype.getChannelName = function () {
            return this.$channel.getName();
        };
        Topic.prototype.publish = function (message) {
            this.$channel.publish(this.$topicName, message);
        };
        Topic.prototype.subscribe = function (callback) {
            return this.$channel.subscribe(this.$topicName, callback);
        };
        Topic.prototype.unsubscribe = function (token) {
            if (token.topicName !== this.$topicName) {
                throw new Error('You can only unsubscribe tokens related to topic ' + this.$topicName);
            }
            this.$channel.unsubscribe(token);
        };
        Topic.prototype.unsubscribeAll = function () {
            var reg = this.$channel.getRegistry();
            var subs = reg.getChannelSubs(this.$channel.getName());
            subs[this.$topicName] = [];
        };
        return Topic;
    })();
    var Channel = (function () {
        function Channel(channelName, registry) {
            this.$subscriptions = {};
            this.$registry = registry;
            this.$channelName = channelName;
        }
        Channel.prototype.getRegistry = function () {
            return this.$registry;
        };
        Channel.prototype.getName = function () {
            return this.$channelName;
        };
        Channel.prototype.getTopic = function (topicName) {
            return new Topic(this, topicName);
        };
        Channel.prototype.publish = function (topicName, message) {
            var msg;
            if (typeof message === 'string') {
                msg = { data: message, $msgId: this.$registry.generateUUID() };
            }
            else {
                msg = message;
            }
            this.$registry.publish(this.$channelName, topicName, msg);
        };
        Channel.prototype.subscribeAll = function (callback) {
            return this.subscribe(this.$registry.$allTopicsName, callback);
        };
        Channel.prototype.subscribe = function (topicName, callback) {
            var tokenId = this.$registry.generateUUID();
            var subs = this.$registry.getTopicSubs(this.$channelName, topicName);
            var token = {
                channelName: this.$channelName,
                topicName: topicName,
                tokenId: tokenId
            };
            subs.push({
                token: token,
                callback: callback
            });
            this.$subscriptions[tokenId] = token;
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
            this.$registry.removeToken(token);
            delete this.$subscriptions[token.tokenId];
        };
        return Channel;
    })();
    var Registry = (function () {
        function Registry() {
            this.$allTopicsName = '$$all-topics';
            this.$allChannelsName = '$$all-channels';
            this.$subscribers = {};
        }
        Registry.prototype.getChannelSubs = function (channelName) {
            this.$subscribers[channelName] = this.$subscribers[channelName] || {};
            return this.$subscribers[channelName];
        };
        Registry.prototype.getTopicSubs = function (channelName, topicName) {
            var channel = this.getChannelSubs(channelName);
            channel[topicName] = channel[topicName] || [];
            return channel[topicName];
        };
        Registry.prototype.removeToken = function (token) {
            var subs = this.getTopicSubs(token.channelName, token.topicName);
            var newList = subs.filter(function (subscriber) {
                return subscriber.token.tokenId !== token.tokenId;
            });
            if (newList.length === 0) {
                delete this.$subscribers[token.channelName][token.topicName];
                if (Object.keys(this.$subscribers[token.channelName]).length === 0) {
                    delete this.$subscribers[token.channelName];
                }
            }
            else {
                this.$subscribers[token.channelName][token.topicName] = newList;
            }
        };
        Registry.prototype.publish = function (channelName, topicName, message) {
            var topicSubs = this.getTopicSubs(channelName, topicName);
            var allTopicSubs = this.getTopicSubs(channelName, this.$allTopicsName);
            var allChannelsSubs = this.getTopicSubs(this.$allChannelsName, this.$allTopicsName);
            this.$publish(channelName, topicName, message, topicSubs);
            this.$publish(channelName, topicName, message, allTopicSubs);
            this.$publish(channelName, topicName, message, allChannelsSubs);
        };
        Registry.prototype.$publish = function (channelName, topicName, message, subscriptions) {
            subscriptions.forEach(function (subscriber) {
                subscriber.callback(message, topicName, channelName);
            });
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
        function MessageService() {
            this.$registry = new Registry();
        }
        MessageService.prototype.getChannel = function (channelName) {
            return new Channel(channelName, this.$registry);
        };
        MessageService.prototype.getTopic = function (channelName, topicName) {
            return new Channel(channelName, this.$registry).getTopic(topicName);
        };
        MessageService.prototype.subscribeAllChannels = function (callback) {
            var tokenId = this.$registry.generateUUID();
            var subs = this.$registry.getTopicSubs(this.$registry.$allChannelsName, this.$registry.$allTopicsName);
            var token = {
                channelName: this.$registry.$allChannelsName,
                topicName: this.$registry.$allTopicsName,
                tokenId: tokenId
            };
            subs.push({
                token: token,
                callback: callback
            });
            return token;
        };
        MessageService.prototype.unsubscribeAllChannels = function (token) {
            if (token.channelName !== this.$registry.$allChannelsName && token.topicName !== this.$registry.$allTopicsName) {
                throw new Error('MessageService only allows unsubscribe to all-channels subscriptions');
            }
            this.$registry.removeToken(token);
        };
        MessageService.prototype.getRegistryStats = function () {
            var stats = {};
            var self = this;
            stats.totalChannels = Object.keys(this.$registry.$subscribers).length;
            stats.totalTopics = 0;
            stats.totalSubscriptions = 0;
            stats.channels = [];
            Object.keys(this.$registry.$subscribers).forEach(function (channelName) {
                var channel = self.$registry.$subscribers[channelName];
                var chStat = {};
                chStat.name = channelName;
                chStat.totalTopics = Object.keys(channel).length;
                chStat.totalSubscriptions = 0;
                chStat.topics = [];
                Object.keys(channel).forEach(function (topicName) {
                    var topic = channel[topicName];
                    var tpStat = {};
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
        };
        return MessageService;
    })();
    ng.service('ngmsMessageService', MessageService);
})(ngms || (ngms = {}));
