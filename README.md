# angular-ms

Not always a shared service or using $rootScope's broadcasts end emits are the best way of communication between components.  
Using a publish/subscribe... *we can decrease the coupling between components and encapsulate the details  used for component communications. This will help increase your component’s modularity, testability and reuse.* as [I read here](http://codingsmackdown.tv/blog/2013/04/29/hailing-all-frequencies-communicating-in-angularjs-with-the-pubsub-design-pattern) and I liked :D

##Angular's Publish/Subscribe Messaging Service

`angular-ms` provides a messaging services to angular based applications. It allows to any component to send and receive messages using publish/subscribe design pattern. 

[Check out a demo here](http://ejmarino.github.io/angular-ms/demo/) (page it's based on SB Admin v2 theme, so some things are not well 'angularized', but it's enough for a demo I think :) )

##How it works

Anyone who wants to get involved in a communication needs a **Channel**. All channels are identified by name and all messages that are broadcasted through it have a **Topic** related.  
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
When you subscribe, you receive a token that represents the subscription registration in the service's registry. This token is only used as a reference to unsubscribe you later if you need it.

```js
var token = topic.subscribe(function(message) {
    console.log(message.data);
});
```

You also can subscribe to a topic directly from the channel.

```js
var token = channel.subscribe('contact.new', function(message) {
    console.log(message.data);
});
```
You have to make sure to unsubscribe when you're done. Bad things can happen if you don't do it :)

```js
$scope.$on('destroy',function() {
    topic.unsubscribe(token);
});
```
You can unsubscribe the entire channel subscriptions instead. This give you the advantage of not having to remember any of the tokens.  
Channel is an instance that knows about only the subscriptions that you made to that instance exclusively.
Subscriptions made to another instances of Channel (even when the instance's have to the same channel name) are not modified here.

```js
$scope.$on('destroy',function() {
    channel.unsubscribeAll();
});
```

Messages are the payload of the channels and its principal information is on 'data' property. You can extend Message type for passing metadata information around 'data' object.

Subscriptor's callback function receive topic and channel name along with the message. You can use the same callback for multiple topics and read the topic name inside the callback. 
The full callback function is `function callback(message, topicName, channelName)`.

Source code are written in Typescript so you have type definitions for everything in the module.
