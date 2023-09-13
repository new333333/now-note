import log from 'electron-log';
import { Protocol } from 'electron';
import NowNote from './modules/NowNote';

export default class ProtocolHandler {
  private protocol;

  private nowNote: NowNote;

  constructor(protocol: Protocol, nowNote: NowNote) {
    this.protocol = protocol;
    this.nowNote = nowNote;

    protocol.registerStreamProtocol(
      'nn-asset',
      async (request: any, callback: any) => {
        log.debug('ProtocolHandler.registerStreamProtocol() request=', request);

        let assetKey;
        if (request.url.indexOf('nn-asset://') > -1) {
          assetKey = request.url.substring('nn-asset://'.length);
        } else {
          assetKey = request.url.substring('nn-asset:'.length);
        }

        log.debug(
          'ProtocolHandler.registerStreamProtocol() assetKey=',
          assetKey
        );

        if (request.headers.Accept.startsWith('image/')) {
          const assetFileReadableStream = await nowNote.getAssetFileReadStream(
            assetKey
          );
          callback({
            data: assetFileReadableStream,
          });
        } else {
          log.debug('registerStreamProtocol: else ', request);
        }
      }
    );
  }
}
