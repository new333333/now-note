import path from 'path';
import fs from 'fs';
import { Asset } from './DataModels';

export default class AssetFilesService {
  private assetsDirectory: string;

  private ASSET_FOLDER_NAME: string = 'assets';

  constructor(assetsDirectory: string) {
    this.assetsDirectory = assetsDirectory;
  }

  async saveBase64ToFile(
    asset: Asset,
    fileName: string,
    base64: string
  ): Promise<string | undefined> {
    if (base64 === null && base64 === undefined) {
      return undefined;
    }
    let assetFile = path.join(
      this.assetsDirectory,
      this.ASSET_FOLDER_NAME,
      asset.key
    );
    await fs.promises.mkdir(assetFile, { recursive: true });
    assetFile = path.join(assetFile, fileName);

    await fs.promises.writeFile(
      assetFile,
      Buffer.from(
        base64.indexOf(',') > -1
          ? base64.substring(base64.indexOf(',') + 1)
          : base64,
        'base64'
      )
    );
    return assetFile;
  }

  async saveLocalFile(
    asset: Asset,
    fileName: string,
    filePathOrBase64: string
  ): Promise<string> {
    let assetFile = path.join(
      this.assetsDirectory,
      this.ASSET_FOLDER_NAME,
      asset.key
    );
    await fs.promises.mkdir(assetFile, { recursive: true });
    assetFile = path.join(assetFile, fileName);
    await fs.promises.copyFile(filePathOrBase64, assetFile);
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
