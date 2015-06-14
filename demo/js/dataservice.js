(function () {
  'use strict';

  var myApp = angular.module('myApp');

  myApp.factory('dataService', function (ngmsMessageService) {

    var data = [];
    var len = 30;

    var startTimestamp = new Date().getTime() - 86400 * len;

    for (var i = 0; i < len; i++) {
      data[i] = {
        id: i + 1,
        timestamp: new Date(startTimestamp + i * 86400),
        temperature: i * 0.3 + 15 + Math.random() * 15,
        humidity: 50 + Math.random() * 50
      };
    }

    var channel = ngmsMessageService.getChannel('ModelChanges');

    function buildRandomItem() {
      return {
        id: 0,
        timestamp: new Date(),
        temperature: 25 + Math.random() * 15,
        humidity: 50 + Math.random() * 50
      };
    }

    function add(item) {
      var newitem = angular.copy(item);
      data.push(newitem);
      newitem.id = data.length;
      newitem.timestamp = new Date();
      channel.publish({ data: newitem, event: 'new', count: data.length });
      return item.id;
    }

    function edit(item) {
      var newitem = angular.copy(item);
      data[newitem.id] = newitem;
      newitem.timestamp = new Date();
      channel.publish({ data: newitem, event: 'update', count: data.length });
    }

    function get(id) {
      return angular.copy(data[id]);
    }

    function query() {
      return angular.copy(data);
    }

    function count() {
      return data.length;
    }

    return {
      query: query,
      get: get,
      count: count,
      add: add,
      edit: edit,
      buildRandomItem: buildRandomItem
    };

  });


} ());