/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../typings/angularjs/angular-mocks.d.ts" />
/// <reference path="../src/interfaces.ts" />

describe('Angular Message Service', () => {

  beforeEach(module('ngms'));

  var ngmsMessageService: ngms.IMessageService;

  beforeEach(inject((_ngmsMessageService_: ngms.IMessageService) => {
    // the injector unwraps the underscores (_) from around the parameter names when matching
    ngmsMessageService = _ngmsMessageService_;
  }));

  describe('Message service methods', () => {
    it('returns a new instance of channel with the specified name', () => {
      var channel: ngms.IChannel = ngmsMessageService.getChannel('testChannel');
      expect(channel.getName()).toEqual('testChannel');
    });
    it('subscribes, publishes and unsubscribes to the allChannel\'s channel', () => {
      var data: any;
      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(0);
      var token = ngmsMessageService.subscribe('*', (message: ngms.IMessage, channelName: string) => {
        data = {
          messageData: message['data'],
          channel: channelName
        };
      });
      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(1);
      var chs: string[] = ['test', 'test2', 'test3', 'test4'];
      chs.forEach((ch: string) => {
        var channel = ngmsMessageService.getChannel(ch);
        channel.publishSync('12345');
        expect(data.messageData).toEqual('12345');
        expect(data.channel).toEqual(ch);
      });
      data = undefined;
      ngmsMessageService.unsubscribe(token);
      chs.forEach((ch: string) => {
        var channel = ngmsMessageService.getChannel(ch);
        channel.publishSync('12345');
        expect(data).toBeUndefined();
      });
      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(0);
    });
  });


});