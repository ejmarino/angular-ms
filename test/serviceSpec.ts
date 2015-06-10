/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../typings/angularjs/angular-mocks.d.ts" />
/// <reference path="../src/angular-ms.ts" />

describe('PasswordController', () => {

  beforeEach(module('ngms'));

  var ngmsMessageService : ngms.IMessageService;

  beforeEach(inject((_ngmsMessageService_ : ngms.IMessageService) => {
    // the injector unwraps the underscores (_) from around the parameter names when matching
    ngmsMessageService = _ngmsMessageService_;
  }));

  describe('Message service methods', () => {
    it('getChannel(name) return an instance of Channel "name"', () => {
      var channel : ngms.IChannel = ngmsMessageService.getChannel('testChannel');
      expect(channel.getName()).toEqual('testChannel');
    });
    it('getTopic(name) return an instance of Topic "name"', () => {
      var chName: string, tpName: string;
      var topic: ngms.ITopic = ngmsMessageService.getTopic(chName, tpName);
      expect(topic.getChannelName()).toEqual(chName);
      expect(topic.getName()).toEqual(tpName);
    });
  });
});