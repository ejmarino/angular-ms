// Declare the main module
var myApp = angular.module('myApp', ['angular-ms']);

myApp.controller('PublisherCtrl', function($scope, messageService) {

  var topic = messageService.getTopic('commy', 'news');

  $scope.publish = function() {
    topic.publish('Hola! gato! ' + new Date().getTime());
  };
});

myApp.controller('Subscriber1Ctrl', function($scope, messageService) {

  var topic = messageService.getChannel('commy').getTopic('news');

  var token;

  $scope.subscribe = function() {
    if (!token) {
    $scope.message1 = 'Subscribed!';
      token = topic.subscribe(function(message) {
        $scope.message1 = message;
      })
    } else {
    $scope.message1 = 'Already Subscribed!';
    }
  };

  $scope.unsubscribe = function() {
    topic.unsubscribe(token);
    $scope.message1 = 'Unsubscribed!';
    token = null;
  };


});

myApp.controller('Subscriber2Ctrl', function($scope, messageService) {

  var topic = messageService.getChannel('commy').getTopic('news');

  topic.subscribe(function(message) {
    $scope.message2 = message;
  })
});