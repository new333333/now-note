import log from 'electron-log';
import * as cheerio from 'cheerio';
import path = require('path');
import { Op } from 'sequelize';
import { FileTransferType } from 'types';
import RepositorySQLite from '../RepositorySQLite';
import { Asset, Link, Note } from '../../DataModels';

async function prepareLinksToSave(
  repository: RepositorySQLite,
  key: string,
  description: string | undefined | null
) {
  log.debug(
    `RepositorySQLite.prepareLinksToSave() key=${key} description=${description}`
  );
  let html: string = '';
  if (description !== undefined && description !== null) {
    html = description;
  }

  const $htmlCntainer = cheerio.load(html, null, false);
  const internalLinks = $htmlCntainer('.mention');

  const newLinks: string[] = [];

  for (let i = 0; i < internalLinks.length; i += 1) {
    const $linkToNote = internalLinks.eq(i);
    log.debug(
      `RepositorySQLite.prepareLinksToSave() $linkToNote=${$linkToNote}`
    );
    const linkToNoteKey: string | undefined = $linkToNote.attr('data-id');
    log.debug(
      `RepositorySQLite.prepareLinksToSave() linkToNoteKey=${linkToNoteKey}`
    );
    if (linkToNoteKey !== undefined) {
      // eslint-disable-next-line no-await-in-loop
      const linkToNote = await Note.findByPk(linkToNoteKey);
      if (linkToNote !== undefined) {
        if (!newLinks.includes(linkToNoteKey)) {
          newLinks.push(linkToNoteKey);
        }
        // eslint-disable-next-line no-await-in-loop
        await Link.findOrCreate({
          where: {
            from: key,
            to: linkToNoteKey,
            type: {
              [Op.or]: {
                [Op.lt]: 'link',
                [Op.eq]: null, // support previous implementation
              },
            },
          },
          defaults: {
            from: key,
            to: linkToNoteKey,
            type: 'link',
          },
        });
      }

      // clean goto-links before write
      $linkToNote.html('');
    }
  }

  const allLinks: Link[] = await Link.findAll({
    where: {
      from: key,
      type: {
        [Op.or]: {
          [Op.lt]: 'link',
          [Op.eq]: null, // support previous implementation
        },
      },
    },
  });

  for (let i = 0; i < allLinks.length; i += 1) {
    const link = allLinks[i];
    // eslint-disable-next-line no-await-in-loop
    const linkToNote = await Note.findByPk(link.to);
    if (linkToNote !== undefined) {
      if (!newLinks.includes(link.to)) {
        // eslint-disable-next-line no-await-in-loop
        await link.destroy();
      }
    } else {
      // eslint-disable-next-line no-await-in-loop
      await link.destroy();
    }
  }

  return $htmlCntainer.html();
}

/*
async function prepareLinksToSave(
  repository: RepositorySQLite,
  key: string,
  description: string | undefined | null
) {
  let html: string = '';
  if (description !== undefined && description !== null) {
    html = description;
  }

  const $htmlCntainer = cheerio.load(html, null, false);
  const internalLinks = $htmlCntainer('[data-nnlink-node]');

  const newLinks: string[] = [];

  for (let i = 0; i < internalLinks.length; i += 1) {
    const $linkToNote = internalLinks.eq(i);
    const linkToNoteKey: string | undefined =
      $linkToNote.attr('data-nnlink-node');
    if (linkToNoteKey !== undefined) {
      // eslint-disable-next-line no-await-in-loop
      const linkToNote = await Note.findByPk(linkToNoteKey);
      if (linkToNote !== undefined) {
        if (!newLinks.includes(linkToNoteKey)) {
          newLinks.push(linkToNoteKey);
        }
        // eslint-disable-next-line no-await-in-loop
        await Link.findOrCreate({
          where: {
            from: key,
            to: linkToNoteKey,
            type: {
              [Op.or]: {
                [Op.lt]: 'link',
                [Op.eq]: null, // support previous implementation
              },
            },
          },
          defaults: {
            from: key,
            to: linkToNoteKey,
            type: 'link',
          },
        });
      }

      // clean goto-links before write
      $linkToNote.html('');
    }
  }

  const allLinks: Link[] = await Link.findAll({
    where: {
      from: key,
      type: {
        [Op.or]: {
          [Op.lt]: 'link',
          [Op.eq]: null, // support previous implementation
        },
      },
    },
  });

  for (let i = 0; i < allLinks.length; i += 1) {
    const link = allLinks[i];
    // eslint-disable-next-line no-await-in-loop
    const linkToNote = await Note.findByPk(link.to);
    if (linkToNote !== undefined) {
      if (!newLinks.includes(link.to)) {
        // eslint-disable-next-line no-await-in-loop
        await link.destroy();
      }
    } else {
      // eslint-disable-next-line no-await-in-loop
      await link.destroy();
    }
  }

  return $htmlCntainer.html();
}
*/

async function prepareInlineImagesToSave(
  repository: RepositorySQLite,
  htmltext: string
) {
  try {
    if (htmltext === undefined) {
      return '';
    }
    const $description = cheerio.load(htmltext, null, false);
    const imgs = $description('img');

    for (let i = 0; i < imgs.length; i += 1) {
      const nextImg = imgs.eq(i);
      const imgSrc = nextImg.attr('src');
      if (imgSrc !== undefined) {
        if (nextImg.attr('data-n3asset-key')) {
          // support old repository implementations
          const assetKey = nextImg.attr('data-n3asset-key');
          nextImg.removeAttr('data-n3asset-key');
          nextImg.attr('src', `nn-asset:${assetKey}`);
        } else if (imgSrc.indexOf('data:image/') === 0) {
          // save as asset data:image/png;base64,...
          const fileType = imgSrc.substring(5, 14); // image/png
          const fileName = 'img.png';
          const filePathOrBase64 = imgSrc.substring(22);
          const fileTransferType: FileTransferType = imgSrc.substring(
            15,
            21
          ) as FileTransferType; // base64
          // eslint-disable-next-line no-await-in-loop
          const asset: Asset = await repository.addAsset(
            fileType,
            fileName,
            filePathOrBase64,
            fileTransferType
          );
          nextImg.attr('src', `nn-asset:${asset.key}`);
        } else if (imgSrc.indexOf('file:///') === 0) {
          // copy/paste e.g. from outlook
          const filePath = imgSrc.substring('file:///'.length);
          // eslint-disable-next-line no-await-in-loop
          const asset: Asset = await repository.addAsset(
            null,
            path.basename(filePath),
            filePath,
            'path'
          );
          nextImg.attr('src', `nn-asset:${asset.key}`);
        } else if (imgSrc.indexOf('file://') === 0) {
          // copy/paste e.g. from outlook
          const filePath = imgSrc.substring('file://'.length);
          // eslint-disable-next-line no-await-in-loop
          const asset: Asset = await repository.addAsset(
            null,
            path.basename(filePath),
            filePath,
            'path'
          );
          nextImg.attr('src', `nn-asset:${asset.key}`);
        }
      }
    }
    return $description.html();
  } catch (e) {
    log.error(e);
    return htmltext;
  }
}

export default async function prepareDescriptionToSave(
  repository: RepositorySQLite,
  key: string,
  html: string
) {
  let htmlResult = await prepareLinksToSave(repository, key, html);
  htmlResult = await prepareInlineImagesToSave(repository, htmlResult);
  return htmlResult;
}
