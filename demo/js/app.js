/* global angular */
(function () {
  'use strict';

  // Declare the main module
  var myApp = angular.module('myApp', ['ngms']);

  myApp.run(function ($interval, dataService) {
    $interval(function() {
      dataService.add(dataService.buildRandomItem());
    }, 2000);    
  });

  myApp.controller('panelsController', function ($scope, ngmsMessageService, dataService) {

    var channel = ngmsMessageService.getChannel('ModelChanges');

    $scope.totalItems = dataService.count();
    $scope.newestDate = '-';
    $scope.tempPeaks = 0;
    $scope.humPeaks = 0;
    $scope.badDays = 0;

    channel.subscribe(function(message) {
      $scope.totalItems = message.count;
      $scope.newestDate = message.data.timestamp.toLocaleTimeString();
      if (message.data.temperature > 35) {
        $scope.tempPeaks++;
      }
      if (message.data.humidity > 90) {
        $scope.humPeaks++;
      }
      if (message.data.humidity > 90 && message.data.temperature > 35) {
        $scope.badDays++;
      }
    }); 

    $scope.$on('destroy', function() {
      channel.unsubscribeAll();
    });

  });

  myApp.controller('messagesController', function ($scope, ngmsMessageService) {

    var channel = ngmsMessageService.getChannel('ModelChanges');

    $scope.itemsList = [];

    channel.subscribe(function (message) {
      $scope.itemsList.push(message.data);
      if ($scope.itemsList.length > 4) {
        $scope.itemsList = $scope.itemsList.splice(1); 
      }
    });

    $scope.$on('destroy', function() {
      channel.unsubscribeAll();
    });

  });



  myApp.controller('graphController', function ($scope, ngmsMessageService) {

    var channel = ngmsMessageService.getChannel('ModelChanges');
    var data = [];

    var graph = Morris.Area({
              element: 'morris-area-chart',
              data: [],
              xkey: 'date',
              ykeys: ['temperature', 'humidity'],
              labels: ['Temperature', 'Humidity'],
              pointSize: 2,
              hideHover: 'auto',
              resize: true
          });

    channel.subscribe(function (message) {
      var item = angular.copy(message.data);
      item.date = item.timestamp.toJSON();
      data.push(item);
      if (data.length > 20) {
        data = data.splice(1); 
      }
      graph.setData(data);
    });

    $scope.$on('destroy', function() {
      channel.unsubscribeAll();
    });

  });


} ());