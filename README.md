# angular-ms

##Angular's Publish/Subscribe Messaging Service

`angular-ms` provides a messaging services to angular based applications. It allows to any controller and service to send and receive messages using publish/subscribe technique. 

[Check out a demo here](http://ejmarino.github.io/angular-ms/demo/) (it's based on SB Admin v2 theme, so some things are not well 'angularized', but it's enough for a demo I think :) )

##How it works

Anyone who wants to get involved in a communication needs a **Channel**. All channels are identified by name and messages that are broadcasted through it have a **Topic** related. 

Once you have a channel, you can subscribe to receive messages related to the topic of your interest.

###Example
```js
// get the 'Model' channel
var channel = ngmsMessageService.getChannel('Model');
```
Get a topic from the channel. This topic have information about the creation of 'contacts' entities

```js
var topic = channel.getTopic('contact.new');
```

Subscribe to topic and set a callback function to be notified when a message is published.
receive a token that represents the subscription.

```js
var token = topic.subscribe(function(message) {
    console.log(message.data);
});
```

You also can subscribe a topic from a channel.

```js
var token = channel.subscribe('contact.new', function(message) {
    console.log(message.data);
});
```

Make sure to unsubscribe when you're done.
```js
$scope.$on('destroy',function() {
    topic.unsubscribe(token);
});
```
You can unsubscribe the entire channel subscriptions instead.
Channel is an instance that keeps the subscriptions since you create it.
Subscriptions made with another instances of a channel (even with the same name) are not modified here.

```js
$scope.$on('destroy',function() {
    channel.unsubscribeAll();
});
```
