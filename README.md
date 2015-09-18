# angular-ms

Not always a shared service or using $rootScope's broadcasts end emits are the best way of communication between components.  

Using a publish/subscribe...
> [...] we can decrease the coupling between components and encapsulate the details used for component communications. This will help increase your component’s modularity, testability and reuse. [...]

...as [I read here](http://codingsmackdown.tv/blog/2013/04/29/hailing-all-frequencies-communicating-in-angularjs-with-the-pubsub-design-pattern) and I liked :D

##Angular's Publish/Subscribe Messaging Service

`angular-ms` provides a messaging services to angular based applications. It allows to any component to send and receive messages using publish/subscribe design pattern. 

[Check out a demo here](http://ejmarino.github.io/angular-ms/demo/) (page it's based on SB Admin v2 theme, so some things are not well 'angularized', but it's enough for a demo I think :) )

##How it works

Anyone who wants to get involved in a communication needs a **Channel**. All channels are identified by name. You can subscribe to a channel to receive messages published in there. 
**Angular-ms** handles three kinds of subcriptions:

 1. *Regular subscriptions*: The most common subscription. You take a channel, subscribe in it and wait for publications.
 2. *Pattern subscriptions*: You can subscribe to multiple channels specifing a pattern with wildcards (*). Every channel in use and every future channel will be evaluated with this pattern. If it matches, it will be automatically subscribed.
 3. *All-Channels subscriptions*: To receive messages of every channel current and future. This can be useful for logging, retransmition of messages to a server, and more.

> Although *All-Channels* subscriptions seems to be a broader form of pattern subscriptions, the first kind are managed on different registers than pattern subscriptions and don't make the registry bigger when a new channel is active.


###Example
```js
// get the 'model.contact' channel
var channel = ngmsMessageService.getChannel('model.contact');
```
This channel have information about the changes of 'contacts' entities

Subscribe to channel and set a callback function to be notified when a message is published.  
When you subscribe, you receive a token that represents the subscription registration in the service's registry. This token is only used as a reference to unsubscribe you later if you need it.

```js
var token = channel.subscribe(function(message) {
    console.log(message);
});
```

You also can subscribe/unsubscribe to a channel directly from the service.

```js
var token = ngmsMessageService.subscribe('model.contact', function(message) {
    console.log(message);
});
```

You have to make sure to unsubscribe when you're done. Bad things can happen if you don't do it :)
If you are in a controller:

```js
$scope.$on('destroy',function() {
    ngmsMessageService.unsubscribe(token);
    ngmsMessageService.unsubscribe(token2);
    ngmsMessageService.unsubscribe(token3);
});
```
Using a **Channel** object have an extra facility: they store every subscription made with that instance, so you can call `channel.unsubscribeAll()` and forget worring about keeping tokens.
Channel objects are instances that knows about only the subscriptions that you made to that instance exclusively.
Subscriptions made to another instances of Channel (even when the instances have the same channel name) are not modified between each other.
```js
$scope.$on('destroy',function() {
    channel.unsubscribeAll();
});
```

### The message 

Messages are the payload of the channels. Every message is a key/value bag of anything you want. Every message have an identity value in $msgId property that identify the message as unique.

Message instance that is broadcasted to the channel and passed to every subscriptor is then same instance that the publisher used. For performance reasons it is not copied. Beware of make any change to the message. If you change the message object maybe some other subscriptor will access the altered version. If you need to do some work on the data received, you must copy it beforehand.

Subscriptor's callback function include channel name along with the message. You can use the same callback for multiple channels and read the channel name inside the callback. 
The full callback function is `function callback(message, channelName)`.

Source code are written in Typescript so you have type definitions for everything in the module.
