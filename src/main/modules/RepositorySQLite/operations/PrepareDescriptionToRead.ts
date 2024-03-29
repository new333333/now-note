import log from 'electron-log';
import * as cheerio from 'cheerio';
import { NoteModel, RepositoryIntern } from '../../DataModels';

const prepareDescriptionToReadLog = log.scope(
  'RepositorySQLite.prepareDescriptionToReadLog'
);

// support old repository implementations
async function prepareInlineImagesPathToRead(
  repository: RepositoryIntern,
  html: string | undefined
): Promise<string> {
  prepareDescriptionToReadLog.debug(`prepareInlineImagesPathToRead`);
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
  repository: RepositoryIntern,
  htmltext: string
): Promise<string> {
  prepareDescriptionToReadLog.debug(`prepareAttachmentsPathToRead`);

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
  prepareDescriptionToReadLog.debug(`fixOldLinksToRead start`);

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
  prepareDescriptionToReadLog.debug(`fixOldLinksToRead ready`);
  return $htmlCntainer.html();
}

async function prepareLinksToRead(
  repository: RepositoryIntern,
  htmlTextParam: string
): Promise<string> {
  prepareDescriptionToReadLog.debug(`prepareLinksToRead start`);

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
      prepareDescriptionToReadLog.debug(
        `prepareLinksToRead reload link to ${linkToNoteKey}`
      );

      // eslint-disable-next-line no-await-in-loop
      const note = await NoteModel.findByPk(linkToNoteKey);
      if (
        note !== null &&
        note.titlePath !== undefined &&
        note.titlePath !== null &&
        note.titlePath.length > 0
      ) {
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
  prepareDescriptionToReadLog.debug(`prepareLinksToRead ready`);

  return $htmlCntainer.html();
}

export default async function prepareDescriptionToRead(
  repository: RepositoryIntern,
  descriptionParam: string
) {
  prepareDescriptionToReadLog.debug(`start`);
  let description = await prepareInlineImagesPathToRead(
    repository,
    descriptionParam
  );
  description = await prepareAttachmentsPathToRead(repository, description);
  description = await prepareLinksToRead(repository, description);
  prepareDescriptionToReadLog.debug(`ready`);
  return description;
}
