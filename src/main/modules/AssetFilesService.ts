import path from 'path';
import fs from 'fs';
import { FileTransferType } from 'types';
import { Asset } from './DataModels';

export default class AssetFilesService {
  private assetsDirectory: string;

  private ASSET_FOLDER_NAME: string = 'assets';

  constructor(assetsDirectory: string) {
    this.assetsDirectory = assetsDirectory;
  }

  async saveFile(
    asset: Asset,
    fileName: string,
    filePathOrBase64: string,
    fileTransferType: FileTransferType
  ): Promise<string> {
    let assetFile = path.join(
      this.assetsDirectory,
      this.ASSET_FOLDER_NAME,
      asset.key
    );
    await fs.promises.mkdir(assetFile, { recursive: true });
    assetFile = path.join(assetFile, fileName);
    if (fileTransferType === 'base64') {
      await fs.promises.writeFile(
        assetFile,
        Buffer.from(filePathOrBase64, 'base64')
      );
    } else {
      await fs.promises.copyFile(filePathOrBase64, assetFile);
    }
    return assetFile;
  }

  async createReadStream(asset: Asset) {
    const assetSrc = path.join(
      this.assetsDirectory,
      this.ASSET_FOLDER_NAME,
      asset.key,
      asset.name
    );
    return fs.createReadStream(assetSrc);
  }

  getAssetFileLocalPath(asset: Asset) {
    return path.join(
      this.assetsDirectory,
      this.ASSET_FOLDER_NAME,
      asset.key,
      asset.name
    );
  }
}
