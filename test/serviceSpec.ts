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
    it('returns a new instance of topic with the specified name', () => {
      var chName: string, tpName: string;
      var topic: ngms.ITopic = ngmsMessageService.getTopic(chName, tpName);
      expect(topic.getChannelName()).toEqual(chName);
      expect(topic.getName()).toEqual(tpName);
    });
    it('subscribes, publishes and unsubscribes to the allChannel\'s channel', () => {
      var data: any;
      expect(ngmsMessageService.getRegistryStats().totalSubscriptions).toEqual(0);
      var token = ngmsMessageService.subscribeAllChannels((message: ngms.IMessage, topicName: string, channelName: string) => {
        data = {
          messageData: message['data'],
          topic: topicName,
          channel: channelName
        };
      });
      expect(ngmsMessageService.getRegistryStats().totalSubscriptions).toEqual(1);
      var chTp: string[][] = [['test', 'test'], ['test', 'test2'], ['test2', 'test'], ['test2', 'test2']];
      chTp.forEach((pair: string[]) => {
        var topic = ngmsMessageService.getTopic(pair[0], pair[1]);
        topic.publishSync('12345');
        expect(data.messageData).toEqual('12345');
        expect(data.channel).toEqual(pair[0]);
        expect(data.topic).toEqual(pair[1]);
      });
      data = undefined;
      ngmsMessageService.unsubscribeAllChannels(token);
      chTp.forEach((pair: string[]) => {
        var topic = ngmsMessageService.getTopic(pair[0], pair[1]);
        topic.publishSync('12345');
        expect(data).toBeUndefined();
      });
      expect(ngmsMessageService.getRegistryStats().totalSubscriptions).toEqual(0);
    });
  });


});