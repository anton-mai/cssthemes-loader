const _ = require('lodash');

const NODECONTENT_KEY = 'node-content';

function getTargetPos(text, target) {
  const regex = new RegExp(`(${target}\\s{)`);
  let selector;
  if ((selector = regex.exec(text)) !== null) {
    const blockStart = selector.index + selector[1].length;
    const closingPos = closingTagPos(text.slice(blockStart));
    if (closingPos < 0) {
      throw Error('Invalid syntax, missing closing tag.');
    }

    return {
      start: selector.index,
      end: blockStart + closingPos,
    };
  }

  return null;
}

function closingTagPos(text, openTag = '{', closingTag = '}') {
  let balance = 1;
  const chain = text.split('');
  for (let chIdx = 0; chIdx < chain.length; chIdx += 1) {
    const char = chain[chIdx];
    if (char === openTag) {
      balance += 1;
    } else if (char === closingTag) {
      balance -= 1;
      if (balance === 0) {
        return chIdx;
      }
    }
  }

  throw new Error('Invalid syntax: not closing tag found.');
}

function labelify(text, selector) {
  const regex = new RegExp(`(${selector})\\s({)`);
  let match;
  if ((match = regex.exec(text)) !== null) {
    const blockStart = match.index + match[0].length;
    const closingPos = closingTagPos(text.slice(blockStart));
    if (closingPos < 0) {
      throw Error('Invalid syntax, missing closing tag.');
    }

    return {
      label: match[1].trim(),
      value: text.slice(blockStart, blockStart + closingPos).trim(),
    };
  }

  throw Error('Missing selector in text.');
}

module.exports = ({ text, target, ignore }) => {
  let updatedText = text;

  for (const iKey of (ignore || [])) {
    const iKeyPos = getTargetPos(updatedText, iKey);
    if (iKeyPos) {
      updatedText = `${updatedText.slice(0, iKeyPos.start)}${updatedText.slice(iKeyPos.end + 1)}`;
    }
  }

  let targetBlock = {};
  const targetPos = getTargetPos(updatedText, target);
  if (targetPos) {
    const targetBlockText = updatedText.slice(targetPos.start, targetPos.end + 1);
    updatedText = `${updatedText.slice(0, targetPos.start)}\n${updatedText.slice(targetPos.end + 1)}`;

    const { value } = labelify(targetBlockText, target);
    updatedText = updatedText.trim() + '\n' + value + '\n';
  }

  return updatedText;
};
