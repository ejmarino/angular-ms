var ngms = angular.module('angular-ms', []);

var MessageService = function() {

  var subscribers = {};

  function getChannelSubs(channelName) {
    subscribers[channelName] = subscribers[channelName] || {};
    return subscribers[channelName];
  }

  function getTopicSubs(channelName, topic) {
    var channel = getChannelSubs(channelName);
    channel[topic] = channel[topic] || [];
    return channel[topic];
  }

  function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }

  function getChannel(channelName) {
    return new Channel(channelName);
  }

  function getTopic(channelName, topic) {
    return new Channel(channelName).getTopic(topic);
  }

  var Topic = function(channel, topic) {

    function getChannelName() {
      return name;
    }

    function getTopic() {
      return topic;
    }

    function publish(message) {
      channel.publish(topic, message);
    }

    function subscribe(callback) {
      return channel.subscribe(topic, callback);
    }

    function unsubscribeAll() {
      // TODO
    }

    function unsubscribe(token) {
      channel.unsubscribe(topic, token);
    }

    return {
      getChannelName: getChannelName,
      getTopic: getTopic,
      publish: publish,
      subscribe: subscribe,
      unsubscribe: unsubscribe,
      unsubscribeAll: unsubscribeAll
    };

  }

  var Channel = function(name) {

    var subscriptions = {};

    function getName() {
      return name;
    }

    function getTopic(topic) {
      return new Topic(this, topic);
    }

    function publish(topic, message) {
      var subs = getTopicSubs(name, topic);
      var newList = subs.filter(function(subscriber) {
        var retval = subscriber.callback(message, topic, name);
        return !retval;
      });
      subscribers[name][topic] = newList;
    }

    function subscribe(topic, callback) {
      var token = generateUUID();
      var subs = getTopicSubs(name, topic);
      subs.push({
        token: token,
        callback: callback
      });
      subscriptions[token] = topic;
      return token;
    }

    function unsubscribeAll() {
      for (var token in subscriptions) {
        unsubscribe(subscriptions[token], token);
      }
      subscriptions = {};
    }

    function unsubscribe(topic, token) {
      var subs = getTopicSubs(name, topic);
      var newList = subs.filter(function(subscriber) {
        return subscriber.token !== token;
      });
      delete subscriptions[topic];
      if (newList.length === 0) {
        delete subscribers[name][topic];
      } else {
        subscribers[name][topic] = newList;
      }
      if (Object.keys(subscribers[name]).length === 0) {
        delete subscribers[name];
      }
    }

    return {
      getName: getName,
      getTopic: getTopic,
      publish: publish,
      subscribe: subscribe,
      unsubscribe: unsubscribe,
      unsubscribeAll: unsubscribeAll
    };

  }

  return {
    getChannel: getChannel,
    getTopic: getTopic
  };

};

ngms.service('messageService', MessageService);