var ngms;
(function (ngms) {
    'use strict';
    var ng = angular.module('ngms', []);
    var Topic = (function () {
        function Topic(channel, topicName) {
            this.channel = channel;
            this.topicName = topicName;
        }
        Topic.prototype.getName = function () {
            return this.topicName;
        };
        Topic.prototype.publish = function (message) {
            this.channel.publish(this.topicName, message);
        };
        Topic.prototype.subscribe = function (callback) {
            return this.channel.subscribe(this.topicName, callback);
        };
        Topic.prototype.unsubscribe = function (token) {
            this.channel.unsubscribe(token);
        };
        Topic.prototype.unsubscribeAll = function () {
            var reg = this.channel.getRegistry();
            var subs = reg.getChannelSubs(this.channel.getName());
            subs[this.topicName] = [];
        };
        return Topic;
    })();
    var Channel = (function () {
        function Channel(channelName, registry) {
            this.subscriptions = {};
            this.registry = registry;
            this.channelName = channelName;
        }
        Channel.prototype.getRegistry = function () {
            return this.registry;
        };
        Channel.prototype.getName = function () {
            return this.channelName;
        };
        Channel.prototype.getTopic = function (topicName) {
            return new Topic(this, topicName);
        };
        Channel.prototype.publish = function (topicName, message) {
            var msg;
            var channelName = this.channelName;
            if (typeof message === 'string') {
                msg = { data: message, msgId: this.registry.generateUUID() };
            }
            else {
                msg = message;
            }
            var subs = this.registry.getTopicSubs(this.channelName, topicName);
            var newList = subs.filter(function (subscriber) {
                var retval = subscriber.callback(msg, topicName, channelName);
                return !retval;
            });
            this.registry.subscribers[this.channelName][topicName] = newList;
        };
        Channel.prototype.subscribe = function (topicName, callback) {
            var tokenId = this.registry.generateUUID();
            var subs = this.registry.getTopicSubs(this.channelName, topicName);
            var token = {
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
        };
        Channel.prototype.unsubscribeAll = function () {
            for (var tokenId in this.subscriptions) {
                this.unsubscribe(this.subscriptions[tokenId]);
            }
            this.subscriptions = {};
        };
        Channel.prototype.unsubscribe = function (token) {
            if (!token) {
                return;
            }
            var subs = this.registry.getTopicSubs(this.channelName, token.topicName);
            var newList = subs.filter(function (subscriber) {
                return subscriber.token.tokenId !== token.tokenId;
            });
            delete this.subscriptions[token.topicName];
            if (newList.length === 0) {
                delete this.registry.subscribers[this.channelName][token.topicName];
            }
            else {
                this.registry.subscribers[this.channelName][token.topicName] = newList;
            }
            if (Object.keys(this.registry.subscribers[this.channelName]).length === 0) {
                delete this.registry.subscribers[this.channelName];
            }
        };
        return Channel;
    })();
    var Registry = (function () {
        function Registry() {
            this.subscribers = {};
        }
        Registry.prototype.getChannelSubs = function (channelName) {
            this.subscribers[channelName] = this.subscribers[channelName] || {};
            return this.subscribers[channelName];
        };
        Registry.prototype.getTopicSubs = function (channelName, topicName) {
            var channel = this.getChannelSubs(channelName);
            channel[topicName] = channel[topicName] || [];
            return channel[topicName];
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
            this.registry = new Registry();
        }
        MessageService.prototype.getChannel = function (channelName) {
            return new Channel(channelName, this.registry);
        };
        MessageService.prototype.getTopic = function (channelName, topicName) {
            return new Channel(channelName, this.registry).getTopic(topicName);
        };
        return MessageService;
    })();
    ng.service('ngmsMessageService', MessageService);
})(ngms || (ngms = {}));
