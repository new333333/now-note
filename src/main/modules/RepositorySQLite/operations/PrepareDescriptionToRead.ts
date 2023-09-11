import log from 'electron-log';
import * as cheerio from 'cheerio';
import path = require('path');
import { Op } from 'sequelize';
import { FileTransferType } from 'types';
import RepositorySQLite from '../RepositorySQLite';
import { Asset, Link, Note } from '../../DataModels';

// support old repository implementations
async function prepareInlineImagesPathToRead(
  repository: RepositorySQLite,
  html: string | undefined
): Promise<string> {
  if (html === undefined) {
    return '';
  }
  const $html = cheerio.load(html, null, false);
  const imgs = $html('img');

  for (let i = 0; i < imgs.length; i += 1) {
    const nextImg = imgs.eq(i);
    if (nextImg.attr('data-n3asset-key') !== undefined) {
      const assetKey = nextImg.attr('data-n3asset-key');
      nextImg.attr('src', `nn-asset:${assetKey}`);
      nextImg.removeAttr('data-n3asset-key');
    }
  }

  return $html.html();
}

async function prepareAttachmentsPathToRead(
  repository: RepositorySQLite,
  htmltext: string
): Promise<string> {
  if (htmltext === undefined) {
    return '';
  }
  // support old repository implementation
  const $linksHiddenContainer = cheerio.load(htmltext, null, false);
  const links = $linksHiddenContainer('a[data-n3asset-key]');

  for (let i = 0; i < links.length; i += 1) {
    const nextLinks = links.eq(i);
    if (nextLinks.attr('data-n3asset-key') !== undefined) {
      const assetKey = nextLinks.attr('data-n3asset-key');

      nextLinks.attr('href', `nn-asset:${assetKey}`);
      nextLinks.removeAttr('data-n3asset-key');
    }
  }

  return $linksHiddenContainer.html();
}

async function fixOldLinksToRead(htmlText: string): Promise<string> {
  if (htmlText === undefined) {
    return '';
  }

  const $htmlCntainer = cheerio.load(htmlText, null, false);
  const internalLinks = $htmlCntainer('[data-nnlink-node]');

  for (let i = 0; i < internalLinks.length; i += 1) {
    const $linkToNote = internalLinks.eq(i);
    if ($linkToNote.attr('data-nnlink-node')) {
      const linkToNoteKey = $linkToNote.attr('data-nnlink-node');
      $linkToNote.replaceWith(
        `<span class="mention" data-index="0" data-denotation-char="/" data-id="${linkToNoteKey}"></span>`
      );
    }
  }

  return $htmlCntainer.html();
}

async function prepareLinksToRead(
  repository: RepositorySQLite,
  htmlTextParam: string
): Promise<string> {
  if (
    htmlTextParam === null ||
    htmlTextParam === undefined ||
    htmlTextParam.trim().length === 0
  ) {
    return '';
  }

  const htmlText: string = await fixOldLinksToRead(htmlTextParam);
  const $htmlCntainer = cheerio.load(htmlText, null, false);
  const internalLinks = $htmlCntainer('.mention');

  for (let i = 0; i < internalLinks.length; i += 1) {
    const $linkToNote = internalLinks.eq(i);
    if ($linkToNote.attr('data-id')) {
      const linkToNoteKey = $linkToNote.attr('data-id');
      // eslint-disable-next-line no-await-in-loop
      const note = await Note.findByPk(linkToNoteKey);
      if (note) {
        let shoWNotePath = note.titlePath.substring(
          2,
          note.titlePath.length - 2
        );
        shoWNotePath = shoWNotePath.replaceAll('/', ' / ');

        $linkToNote.attr('data-value', shoWNotePath);
      } else {
        $linkToNote.attr('data-value', `Note ${linkToNoteKey} NOT FOUND!`);
      }
    }
  }

  return $htmlCntainer.html();
}

export default async function prepareDescriptionToRead(
  repository: RepositorySQLite,
  descriptionParam: string
) {
  let description = await prepareInlineImagesPathToRead(
    repository,
    descriptionParam
  );
  description = await prepareAttachmentsPathToRead(repository, description);
  description = await prepareLinksToRead(repository, description);
  return description;
}
