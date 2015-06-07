# angular-ms

##Angular's Publish/Subscribe Messaging Service

`angular-ms` provides a messaging services to angular based applications. It allows to any controller and service to send and receive messages using publish/subscribe technique. 

##How it works

Anyone who wants to get involved in a communication needs a **Channel**. All channels are identified by name and messages that are broadcasted through it have a **Topic** related. 

Once you have a channel, you can subscribe to receive messages related to the topic of your interest.

###Example
```
// get the 'Model' channel
var channel = ngmsMessageService.getChannel('Model');
```
Get a topic from the channel. This topic have information about the creation of 'contacts' entities

```
var topic = channel.getTopic('contact.new');
```

Subscribe to topic and set a callback function to be notified when a message is published.
receive a token that represents the subscription.
```
var token = topic.subscribe(function(message) {
    console.log(message.data);
});
```
Make sure to unsubscribe when you're done.
```
$scope.$on('destroy',function() {
    topic.unsubscribe(token);
});
```
You can unsubscribe the entire channel subscriptions instead.
Channel is an instance that keeps the subscriptions since you create it.
Subscriptions made with another instances of a channel (even with the same name) are not modified here.

```
$scope.$on('destroy',function() {
    channel.unsubscribeAll();
});
```
